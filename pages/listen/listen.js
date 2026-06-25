const {
  getUnits,
  getUnitResource
} = require('../../utils/api')
const { login } = require('../../utils/login')
const {
  buildListeningQuizQuestions,
  buildReciteParts,
  instantiateQuizQuestion,
  normalizeUnitResource,
  hasSpellStep,
  hasFillStep,
  buildQuizStepList,
  decorateQuizStepList
} = require('./listen-quiz')
const {
  buildMockReviewResource
} = require('../../utils/review-mock')
const { computeQuizScoreRate } = require('../../utils/finish-stars')
const {
  buildLevelNavTitle,
  buildLevelNavSubtitle
} = require('../../utils/level-nav')
// 通常听力播放走全局单例（跨页持续 + 迷你播放器）；buildTracks 复用单例里的实现
const { player, buildTracks } = require('../../utils/player')
const { IMAGE_BASE_URL, imageUrl } = require('../../utils/image-host')
const { buildVoiceUrl } = require('../../utils/voice-url')
const { getFallbackBookCover, normalizeBookCover } = require('../../utils/book-cover')
const { isLevelUnlocked } = require('../../utils/level-access')
const mockStore = require('../../utils/mock/mock-store')
const { promptVipPurchase } = require('../../utils/vip-purchase')
const {
  syncRecordingOverlay,
  hideRecordingOverlay
} = require('../../utils/recording-overlay')
const { appendReturnTabQuery } = require('../../utils/return-tab')
const {
  hasCompletedListenGuide,
  markListenGuideDone,
  findGuideTrackIndex
} = require('../../utils/listen-guide')
const {
  isQuizDevFixtureEnabled,
  buildQuizDevUnitResource,
  buildQuizDevUnitsList,
  QUIZ_DEV_UNIT_ID,
  QUIZ_DEV_UNIT_SORT
} = require('../../utils/quiz-dev-fixture')
const LISTEN_WORD_TAG_IMAGE = IMAGE_BASE_URL + '/images/listen/tag-word-jelly.png'
const LISTEN_SENTENCE_TAG_IMAGE = IMAGE_BASE_URL + '/images/listen/tag-sentence-jelly.png'
const LOADING_MASCOT_SPRITE = imageUrl('/images/listen/loading-mascot-sprite.png')

const LISTEN_PAGE_ANIM_MS = 320
// 与 app.json tabBar.list 保持一致
const TAB_ROUTES = ['pages/today/today', 'pages/home/home', 'pages/me/me']
// 联调用：加载 utils/quiz-dev-fixture.js 里的测试词表（三步 + 两步无听填）。测完改回 false。
const USE_QUIZ_DEV_FIXTURE = false
// 联调用：只出前 N 个词的小测；0 = 全量。fixture 共 2 词，保持 2 即可。
const QUIZ_DEV_WORD_LIMIT = 2

const QUIZ_NEXT_COUNTDOWN_S = 3
// media 组件评分反馈（彩带/表情）展示 2000ms 后淡出，倒计时等它播完
const QUIZ_CELEBRATE_DELAY_MS = 2200

function isListenUnitUnlocked(unit, index) {
  const sort = Number(unit && unit.sort) || (Number(index) + 1)
  return isLevelUnlocked(sort)
}

function decorateListenUnits(units) {
  return (Array.isArray(units) ? units : []).map((unit, index) => Object.assign({}, unit, {
    isUnlockedForListen: isListenUnitUnlocked(unit, index)
  }))
}

function limitQuizQuestionsForDev(questions) {
  const list = Array.isArray(questions) ? questions : []
  if (!QUIZ_DEV_WORD_LIMIT || QUIZ_DEV_WORD_LIMIT <= 0) {
    return list
  }

  // 联调优先选能走满三步的词：有填空素材 + 词长够拼写
  const ranked = list.map((question, index) => {
    const word = question && question.word ? String(question.word) : ''
    let score = 0
    if (!question.skipFill) {
      score += 2
    }
    if (word.length >= 4) {
      score += 2
    } else if (word.length >= 3) {
      score += 1
    }
    if (question.spell || hasSpellStep(question.spell)) {
      score += 1
    }
    return { question, index, score }
  })

  ranked.sort((a, b) => b.score - a.score || a.index - b.index)
  return ranked
    .slice(0, QUIZ_DEV_WORD_LIMIT)
    .sort((a, b) => a.index - b.index)
    .map(item => item.question)
}

function getActiveQuizSpell(page) {
  const data = page.data || {}
  if (hasSpellStep(data.quizSpell)) {
    return data.quizSpell
  }
  const runtime = page.quizRuntimeQuestion
  if (hasSpellStep(runtime && runtime.spell)) {
    return runtime.spell
  }
  return null
}

function postListeningQuizResult(payload) {
  let report
  try {
    report = require('../../utils/api').reportListeningQuizResult
  } catch (err) {
    return
  }
  if (typeof report !== 'function') {
    return
  }
  report(payload).catch(() => {})
}

// 与 wxss 里 listen-slide-up 动画时长一致
const ANIM_IN_MS = 360

Page({
  data: {
    imageBaseUrl: IMAGE_BASE_URL,
    listenWordTagImage: LISTEN_WORD_TAG_IMAGE,
    listenSentenceTagImage: LISTEN_SENTENCE_TAG_IMAGE,
    loadingMascotSprite: LOADING_MASCOT_SPRITE,
    pageAnimState: 'listen-page-preenter',
    pageSettled: false,
    safeAreaBottom: Math.max((wx.getStorageSync('windowHeight') || 0) - ((wx.getStorageSync('safeArea') || {}).bottom || wx.getStorageSync('windowHeight') || 0), 0),

    loading: true,
    bookCover: getFallbackBookCover(),

    // 期（单元）列表
    units: [],
    unitIndex: 0,
    unitName: '伴读',
    navTitle: '',
    navSubtitle: '',

    // 当前期的播放列表（单词 + 例句，顺序混排）
    tracks: [],
    current: 0,

    // 播放状态
    playing: false,
    currentPage: 0, // swiper：0 封面，1 课文
    progress: 0, // 0 - 100，覆盖整期
    currentTime: '00:00',

    speedIndex: 0,
    speedLabel: '1.0x',

    loopIndex: 0,
    loopLabel: '列',

    showPlaylist: false,

    // 课文页：跟读测评展开项（-1 表示未展开）及各句得分缓存
    expandedIndex: -1,
    trackScores: {},
    // 课文滚动位置（受控 scroll-top）。激活/展开时只在必要时滚动，不再贴顶
    scrollTop: 0,
    tonearmInstant: false,

    // 首次进入引导：swipe 向左滑 | evaluate 展开例句提示 | record 自动开录
    listenGuideActive: false,
    listenGuideStep: '',
    // evaluate/record 遮罩聚光位置（px，相对视口）。width 为 0 表示尚未测量
    listenGuideSpot: { top: 0, left: 0, width: 0, height: 0, micX: 0, micY: 0, calloutTop: 0, placement: 'below' },
    followRecordingOverlay: { active: false, top: 0, left: 0, width: 0, height: 0, waveSession: 0 },

    quizMode: false,
    quizQuestions: [],
    quizQuestion: null,
    quizIndex: 0,
    quizAnsweredCount: 0,
    quizProgressPercent: 0,
    quizChecked: false,
    quizResultText: '',
    quizReviewWordResults: [],
    // fill: 听音填空 | recite: 看着背诵 + 语音评测 | spell: 单词拼写
    quizPhase: 'fill',
    quizReciteParts: [],
    quizReciteScore: '',
    quizMarking: false,
    quizNextCountdown: 0,
    quizNextPaused: false,
    quizNextIsSubmit: false,
    quizAllDone: false,
    quizRecords: [],
    quizAudioPlaying: false,
    // 题型由数据决定：听音填空 / 背诵评测 / 单词拼写 可出现 1~3 步
    quizHasFill: true,
    quizHasRecite: true,
    quizHasSpell: false,
    quizStepList: [],
    quizSpell: null,
    quizSpellSelectedIndex: null,
    quizSpellCorrect: false,
    quizSpellFilled: '',
    dialog: { type: '' }
  },

  onLoad(options) {
    options = options || {}
    this.closing = false
    this.setData({ pageAnimState: 'listen-page-preenter' })
    const book = (getApp().globalData && getApp().globalData.book) || {}
    this.resBookId = options.resBookId || book.resBookId || ''
    this.resBookName = options.name
      ? decodeURIComponent(options.name)
      : (book.name || '')
    this.targetUnitId = options.unitId || ''
    this.returnTab = options.returnTab || ''
    const quizMode = options.mode === 'quiz' || options.taskType === 'listening'
    // 错词复习模式：review=1，reviewUnitIds 为覆盖的关卡 id 列表。
    this.review = options.review === '1' || options.review === 1
    // 今日页「免费体验关」：放行会员内容门槛，让免费用户也能听第一关小测。
    this.trial = options.trial === '1' || options.trial === 1
    this.reviewUnitIds = options.reviewUnitIds
      ? decodeURIComponent(options.reviewUnitIds).split(',').filter(Boolean)
      : []
    this.useQuizDevFixture = quizMode && isQuizDevFixtureEnabled(
      USE_QUIZ_DEV_FIXTURE || options.quizDev === '1' || options.quizDev === 1
    )
    this.setData({ quizMode, review: this.review })
    const bookCover = normalizeBookCover(book.bookCover || this.data.bookCover)
    if (book.bookCover) {
      this.setData({ bookCover })
    }

    if (quizMode) {
      // 关卡小测：独立局部音频，不影响/不复用全局随身听
      this.setData({ pageAnimState: '' })
      player.suspendForExternalAudio('listen-quiz')
      this.initQuizAudio()
      login().then(() => this.loadUnits())
      return
    }

    // 通常随身听：作为全局播放器的视图。订阅状态，已在播则 resume 不重载。
    this.onPlayerState = this.onPlayerState.bind(this)
    player.subscribe(this.onPlayerState)
    login().then(() => player.start({
      resBookId: this.resBookId,
      bookCover,
      targetUnitId: this.targetUnitId
    }))
  },

  onReady() {
    this.measureSeekBar()
  },

  markListenPageSettled() {
    if (this._listenSettleTimer) {
      clearTimeout(this._listenSettleTimer)
      this._listenSettleTimer = null
    }
    this._listenSettleTimer = setTimeout(() => {
      this._listenSettleTimer = null
      if (this.closing || this.data.quizMode) {
        return
      }
      this.setData({ pageSettled: true })
    }, ANIM_IN_MS)
  },

  onShow() {
    if (this.closing) {
      return
    }
    if (this.data.quizMode) {
      return
    }
    this.setData({ pageAnimState: 'listen-page-preenter', pageSettled: false })
    wx.nextTick(() => {
      setTimeout(() => {
        if (this.closing) {
          return
        }
        this.setData({ pageAnimState: 'listen-page-enter' })
        this.markListenPageSettled()
        if (!this.data.quizMode && !this.data.loading) {
          this.maybeStartListenGuide()
        }
      }, 20)
    })
  },

  measureSeekBar() {
    this.createSelectorQuery().select('.seek').boundingClientRect(rect => {
      if (rect && rect.width) {
        this.seekRect = rect
      }
    }).exec()
  },

  onUnload() {
    if (this.data.quizMode) {
      player.resumeFromExternalAudio('listen-quiz')
      this.clearQuizTimers()
      if (this.quizAudio) {
        this.quizAudio.offEnded()
        this.quizAudio.offError()
        this.quizAudio.destroy()
        this.quizAudio = null
      }
      return
    }
    // 通常模式：仅退订，音频交由全局单例继续播放（迷你播放器仍可控制）
    player.unsubscribe(this.onPlayerState)
  },

  // 全局播放器状态推送 -> 同步到视图
  onPlayerState(s) {
    if (this.data.quizMode) {
      return
    }
    const prevCurrent = this.data.current
    const prevUnitIndex = this.data.unitIndex
    const wasLoading = this.data.loading
    const patch = {
      loading: !s.active,
      unitName: s.unitName,
      bookCover: normalizeBookCover(s.bookCover),
      units: decorateListenUnits(s.units),
      unitIndex: s.unitIndex,
      tracks: s.tracks,
      current: s.current,
      playing: s.playing,
      progress: s.progress,
      currentTime: s.currentTime,
      speedIndex: s.speedIndex,
      speedLabel: s.speedLabel,
      loopIndex: s.loopIndex,
      loopLabel: s.loopLabel
    }
    if (wasLoading && s.active && s.playing) {
      patch.tonearmInstant = true
    }
    this.setData(patch, () => {
      if (patch.tonearmInstant) {
        setTimeout(() => this.setData({ tonearmInstant: false }), 32)
      }
      if (s.active && s.tracks && s.tracks.length) {
        this.maybeStartListenGuide()
      }
    })
    // 切换期：清空展开面板与该期的得分缓存
    if (s.unitIndex !== prevUnitIndex) {
      this.setData({ expandedIndex: -1, trackScores: {} })
    }
    if (s.current !== prevCurrent) {
      this.scrollToCurrent()
    }
  },

  /* ----------------------------- 数据加载（仅听力小测/错词复习） ----------------------------- */

  loadUnits() {
    if (this.review) {
      this.loadReviewUnit()
      return
    }
    if (this.useQuizDevFixture) {
      this.loadQuizDevUnit()
      return
    }
    if (!this.resBookId) {
      this.setData({ loading: false })
      wx.showToast({ title: '请先在学习页选择教材', icon: 'none' })
      return
    }
    getUnits(this.resBookId).then(data => {
      const list = (data && Array.isArray(data.list)) ? data.list : []
      if (!list.length) {
        this.setData({ loading: false })
        wx.showToast({ title: '暂无可听内容', icon: 'none' })
        return
      }
      const targetIndex = this.targetUnitId
        ? list.findIndex(item => String(item.unitId) === String(this.targetUnitId))
        : 0
      this.setData({ units: decorateListenUnits(list) })
      this.loadUnit(Math.max(targetIndex, 0), false)
    })
  },

  // 错词复习用假数据（结构同 getUnitResource），后期换成真实错词接口即可。
  // 假数据没有音频，tracks 为空，因此只走 quizMode 的听力填空。
  loadReviewUnit() {
    const source = buildMockReviewResource(this.reviewUnitIds)
    const quizQuestions = limitQuizQuestionsForDev(buildListeningQuizQuestions(source))
    this.unitSort = 0
    this.setData({
      loading: false,
      units: [],
      unitIndex: 0,
      unitName: '错词复习',
      ...this.getQuizNavMeta(0, quizQuestions.length),
      tracks: buildTracks(source),
      current: 0,
      progress: 0,
      currentTime: '00:00',
      showPlaylist: false,
      quizQuestions,
      quizIndex: 0,
      quizAnsweredCount: 0,
      quizProgressPercent: 0,
      quizChecked: false,
      quizResultText: '',
      quizReviewWordResults: [],
      quizPhase: 'fill',
      quizReciteParts: [],
      quizReciteScore: '',
      quizMarking: false,
      quizAllDone: false,
      quizRecords: []
    })
    this.showQuizQuestion(0, true)
  },

  // 联调专用：planet（听填→背诵→拼写）+ spade（背诵→拼写，无听填）
  loadQuizDevUnit() {
    const units = decorateListenUnits(buildQuizDevUnitsList())
    const source = normalizeUnitResource(buildQuizDevUnitResource())
    const tracks = buildTracks(source)
    const quizQuestions = limitQuizQuestionsForDev(buildListeningQuizQuestions(source))

    this.unitSort = QUIZ_DEV_UNIT_SORT
    this.targetUnitId = QUIZ_DEV_UNIT_ID
    this.setData({
      loading: false,
      units,
      unitIndex: 0,
      unitName: '联调小测',
      ...this.getQuizNavMeta(0, quizQuestions.length),
      tracks,
      current: 0,
      progress: 0,
      currentTime: '00:00',
      showPlaylist: false,
      quizQuestions,
      quizIndex: 0,
      quizAnsweredCount: 0,
      quizProgressPercent: 0,
      quizChecked: false,
      quizResultText: '',
      quizReviewWordResults: [],
      quizPhase: 'fill',
      quizReciteParts: [],
      quizReciteScore: '',
      quizMarking: false,
      quizAllDone: false,
      quizRecords: []
    })
    this.showQuizQuestion(0, true)
    wx.showToast({ title: '联调试卷：2词', icon: 'none' })
  },

  getQuizNavMeta(index, totalOptional) {
    const total = totalOptional != null ? totalOptional : (this.data.quizQuestions.length || 0)
    if (this.data.review) {
      return {
        navTitle: '错词复习',
        navSubtitle: buildLevelNavSubtitle(index, total)
      }
    }
    const sort = this.unitSort || ((this.data.units[this.data.unitIndex] || {}).sort) || (this.data.unitIndex + 1)
    return {
      navTitle: buildLevelNavTitle(sort),
      navSubtitle: buildLevelNavSubtitle(index, total)
    }
  },

  loadUnit(index, autoPlay, toEnd) {
    const unit = this.data.units[index]
    if (!unit) {
      return
    }
    // 第 1 关随身听免费，其余关卡需开通会员；今日页「免费体验关」（trial）放行。
    const unitSort = Number(unit.sort) || index + 1
    const lockedByVip = (!this.data.review && !this.trial && !isLevelUnlocked(unitSort)) ||
      (unit.needVip && !this.trial)
    if (lockedByVip) {
      promptVipPurchase(null)
      return
    }
    this.setData({ loading: true })
    getUnitResource(unit.unitId).then(list => {
      const source = normalizeUnitResource(list)
      const tracks = buildTracks(source)
      const sort = unit.sort || index + 1
      this.unitSort = sort
      // 统一显示为「关卡N」，不沿用后端的「第N期」命名
      const unitName = '关卡' + sort

      const quizQuestions = limitQuizQuestionsForDev(buildListeningQuizQuestions(source))

      this.setData({
        loading: false,
        unitIndex: index,
        unitName,
        ...this.getQuizNavMeta(0, quizQuestions.length),
        tracks,
        current: toEnd ? Math.max(tracks.length - 1, 0) : 0,
        progress: 0,
        currentTime: '00:00',
        showPlaylist: false,
        quizQuestions,
        quizIndex: 0,
        quizAnsweredCount: 0,
        quizProgressPercent: 0,
        quizChecked: false,
        quizResultText: '',
        quizReviewWordResults: [],
        quizPhase: 'fill',
        quizReciteParts: [],
        quizReciteScore: '',
        quizMarking: false,
        quizAllDone: false,
        quizRecords: []
      })
      this.showQuizQuestion(0, true)
      if (!quizQuestions.length && !tracks.length) {
        wx.showToast({ title: '本期暂无可测试例句', icon: 'none' })
      }
    })
  },

  /* ----------------------------- 听力填空 ----------------------------- */

  cancelQuizReciteMedia() {
    const media = this.selectComponent('.quiz-recite-media')
    if (!media) {
      return
    }
    if (typeof media.cancel === 'function') {
      media.cancel()
    }
  },

  syncQuizStepList(quizPhase) {
    const phase = quizPhase || this.data.quizPhase
    const quizStepList = decorateQuizStepList(this.data.quizStepList, phase)
    if (quizStepList.length) {
      this.setData({ quizStepList })
    }
  },

  applyQuizStepPlan(question, spell) {
    const quizHasFill = hasFillStep(question)
    const quizHasRecite = !!(question && question.sentence)
    const quizHasSpell = hasSpellStep(spell)
    const quizStepList = buildQuizStepList(quizHasFill, quizHasRecite, quizHasSpell)
    const initialPhase = (quizStepList[0] && quizStepList[0].key) || 'recite'

    return {
      quizHasFill,
      quizHasRecite,
      quizHasSpell,
      quizStepList: decorateQuizStepList(quizStepList, initialPhase),
      quizPhase: initialPhase,
      quizChecked: !quizHasFill
    }
  },

  patchQuizStepPlan(spell, quizPhase) {
    const runtime = this.quizRuntimeQuestion || {}
    const quizHasFill = this.data.quizHasFill != null
      ? this.data.quizHasFill
      : hasFillStep(runtime)
    const quizHasRecite = this.data.quizHasRecite != null
      ? this.data.quizHasRecite
      : !!(runtime.sentence)
    const quizHasSpell = hasSpellStep(spell)
    const phase = quizPhase || this.data.quizPhase
    const quizStepList = buildQuizStepList(quizHasFill, quizHasRecite, quizHasSpell)

    return {
      quizHasFill,
      quizHasRecite,
      quizHasSpell,
      quizStepList: decorateQuizStepList(quizStepList, phase),
      quizSpell: spell
    }
  },

  showQuizQuestion(index, autoPlay) {
    this.clearQuizTimers()
    if (this.data.quizPhase === 'recite') {
      this.cancelQuizReciteMedia()
    }
    const questions = this.data.quizQuestions
    const sourceQuestion = questions[index]

    if (!sourceQuestion) {
      this.setData({
        quizQuestion: null,
        quizProgressPercent: 100
      })
      return
    }

    const question = instantiateQuizQuestion(sourceQuestion)
    if (!question) {
      this.setData({
        quizQuestion: null,
        quizProgressPercent: 100
      })
      return
    }

    this.quizRuntimeQuestion = question
    this.quizAnswers = question.gaps.map(() => '')
    this.quizOptionUsed = question.options.map(() => false)

    const spell = question.spell || null
    const stepPlan = this.applyQuizStepPlan(question, spell)

    this.setData(Object.assign({
      quizIndex: index,
      ...this.getQuizNavMeta(index),
      quizReciteParts: buildReciteParts(sourceQuestion.reciteRefText || sourceQuestion.sentence),
      quizReciteScore: '',
      quizMarking: false,
      quizNextIsSubmit: false,
      quizSpell: spell,
      quizSpellSelectedIndex: null,
      quizSpellCorrect: false,
      quizSpellFilled: ''
    }, stepPlan))
    this.setQuizViewQuestion(question, stepPlan.quizChecked, '')

    if (autoPlay && stepPlan.quizPhase === 'fill') {
      this.playQuizAudio()
    }
  },

  setQuizViewQuestion(question, checked, resultText) {
    const answers = this.quizAnswers || []
    const optionUsed = this.quizOptionUsed || []
    const answeredCount = checked
      ? Math.max(this.data.quizAnsweredCount, this.data.quizIndex + 1)
      : this.data.quizAnsweredCount
    const total = this.data.quizQuestions.length || 1
    const parts = question.parts.map(part => {
      if (part.type !== 'blank') {
        return part
      }

      const value = answers[part.gapIndex] || ''
      let status = value ? 'filled' : 'empty'
      if (checked) {
        status = value === part.answer ? 'correct' : 'wrong'
      }

      return Object.assign({}, part, {
        value,
        status
      })
    })
    const options = question.options.map((option, index) => Object.assign({}, option, {
      used: !!optionUsed[index]
    }))

    this.setData({
      quizQuestion: Object.assign({}, question, {
        parts,
        options
      }),
      quizAnsweredCount: answeredCount,
      quizProgressPercent: Math.round(answeredCount * 100 / total),
      quizChecked: checked,
      quizResultText: resultText,
      quizHasAnswers: answers.some(Boolean)
    })
  },

  onQuizOptionTap(e) {
    if (this.data.quizChecked || !this.data.quizQuestion) {
      return
    }

    const optionIndex = Number(e.currentTarget.dataset.index)
    const question = this.quizRuntimeQuestion
    if (!question || this.quizOptionUsed[optionIndex]) {
      return
    }

    const gapIndex = this.quizAnswers.findIndex(answer => !answer)
    if (gapIndex < 0) {
      return
    }

    this.quizAnswers[gapIndex] = question.options[optionIndex].text
    this.quizOptionUsed[optionIndex] = true

    const filled = this.quizAnswers.every(Boolean)
    if (filled) {
      const correct = this.isQuizCorrect(question)
      const records = (this.data.quizRecords || []).slice()
      records[this.data.quizIndex] = Object.assign({}, records[this.data.quizIndex], {
        fillCorrect: correct
      })
      this.setData({ quizRecords: records })
      this.setQuizViewQuestion(question, true, this.getQuizResultText(correct))
      if (!correct) {
        this.rememberWrongQuizWord({
          unitId: question.unitId || this.targetUnitId || '',
          wordId: question.wordId || '',
          word: question.word || '',
          correct: false
        })
      }
      wx.nextTick(() => {
        this.scheduleFillToRecite()
      })
    } else {
      this.setQuizViewQuestion(question, false, '')
    }
  },

  onQuizBlankTap(e) {
    if (!this.data.quizQuestion || this.data.quizChecked) {
      return
    }

    const gapIndex = Number(e.currentTarget.dataset.gapIndex)
    const value = this.quizAnswers[gapIndex]
    const question = this.quizRuntimeQuestion
    if (!question || !value) {
      return
    }

    const optionIndex = question.options.findIndex((option, index) => (
      option.text === value && this.quizOptionUsed[index]
    ))
    if (optionIndex >= 0) {
      this.quizOptionUsed[optionIndex] = false
    }
    this.quizAnswers[gapIndex] = ''
    this.setQuizViewQuestion(question, false, '')
  },

  onQuizClearAll() {
    if (this.data.quizChecked || !this.data.quizQuestion) {
      return
    }

    const question = this.quizRuntimeQuestion
    if (!question) {
      return
    }

    this.quizAnswers = question.gaps.map(() => '')
    this.quizOptionUsed = question.options.map(() => false)
    this.setQuizViewQuestion(question, false, '')
  },

  isQuizCorrect(question) {
    return question.gaps.every(gap => this.quizAnswers[gap.gapIndex] === gap.answer)
  },

  getQuizResultText(correct) {
    return correct ? '全部填对了' : '有些词填错了，即将进入背诵'
  },

  rememberQuizWordResult(question, correct) {
    if (!question) {
      return
    }

    const payload = {
      unitId: question.unitId || this.targetUnitId || '',
      wordId: question.wordId || '',
      word: question.word || '',
      correct: !!correct
    }
    const results = (this.data.quizReviewWordResults || []).concat(payload)
    this.setData({ quizReviewWordResults: results })

    if (!correct) {
      this.rememberWrongQuizWord(payload)
    }
  },

  submitQuizWordResult() {
    const index = this.data.quizIndex
    const question = this.quizRuntimeQuestion
    const record = ((this.data.quizRecords || [])[index]) || {}
    if (!question) {
      return
    }

    const payload = {
      unitId: question.unitId || this.targetUnitId || '',
      wordId: question.wordId || '',
      word: question.word || ''
    }
    if (record.fillCorrect != null) {
      payload.fillCorrect = !!record.fillCorrect
    }
    if (record.reciteScore != null && record.reciteScore !== '') {
      payload.reciteScore = Number(record.reciteScore)
    }
    if (record.spellCorrect != null) {
      payload.spellCorrect = !!record.spellCorrect
    }
    if (payload.fillCorrect != null && payload.reciteScore == null && payload.spellCorrect == null) {
      payload.correct = payload.fillCorrect
      payload.phase = 'fill'
    }

    postListeningQuizResult(payload)
  },

  rememberWrongQuizWord(payload) {
    // 错词本是学习数据（接后端上报错词、复习走 review-words），收口到 mock-store
    const list = mockStore.getSlice('listeningWrongWords') || []
    const id = payload.wordId || payload.word
    const next = Array.isArray(list)
      ? list.filter(item => (item.wordId || item.word) !== id)
      : []

    next.push(Object.assign({}, payload, {
      updatedAt: Date.now()
    }))
    mockStore.setSlice('listeningWrongWords', next)
  },

  playQuizAudio() {
    const question = this.quizRuntimeQuestion || this.data.quizQuestion
    if (!question || !question.audio || !this.quizAudio) {
      return
    }

    this.quizAudio.stop()
    this.quizAudio.src = question.audio
    this.quizAudio.play()
    this.setData({ playing: true, quizAudioPlaying: true })
  },

  replayQuizAudio() {
    this.playQuizAudio()
  },

  stopQuizCountdownTimer() {
    this.quizCountdownSeq = (this.quizCountdownSeq || 0) + 1
    if (this.quizCountdownTimer) {
      clearTimeout(this.quizCountdownTimer)
      this.quizCountdownTimer = null
    }
    this.quizCountdownDone = null
  },

  clearQuizTimers() {
    this.stopQuizCountdownTimer()
    this.quizPendingNext = null
    if (this.data.quizNextCountdown || this.data.quizNextPaused) {
      this.setData({ quizNextCountdown: 0, quizNextPaused: false })
    }
  },

  // 单次取消：点倒计时暂停本题的自动切换，点「进入下一步」手动继续；新倒计时恢复自动
  pauseQuizCountdown() {
    const done = this.quizCountdownDone
    this.stopQuizCountdownTimer()
    this.quizPendingNext = done
    this.setData({ quizNextCountdown: 0, quizNextPaused: true })
  },

  resumeQuizNext() {
    const done = this.quizPendingNext
    this.quizPendingNext = null
    this.setData({ quizNextPaused: false })
    if (typeof done === 'function') {
      done()
    }
  },

  // 立即跳过：不等倒计时走完，直接执行本题的下一步
  skipQuizNext() {
    const done = this.quizCountdownDone
    this.stopQuizCountdownTimer()
    this.quizPendingNext = null
    this.setData({ quizNextCountdown: 0, quizNextPaused: false })
    if (typeof done === 'function') {
      done()
    }
  },

  scheduleQuizCountdown(done, delayMs) {
    this.stopQuizCountdownTimer()
    this.quizPendingNext = null
    if (this.data.quizNextPaused) {
      this.setData({ quizNextPaused: false })
    }
    this.quizCountdownDone = done
    const token = this.quizCountdownSeq
    let left = QUIZ_NEXT_COUNTDOWN_S

    const tick = () => {
      if (token !== this.quizCountdownSeq) {
        return
      }
      this.setData({ quizNextCountdown: left })
      if (left <= 0) {
        this.quizCountdownDone = null
        if (typeof done === 'function') {
          done()
        }
        return
      }
      left -= 1
      this.quizCountdownTimer = setTimeout(tick, 1000)
    }

    if (delayMs > 0) {
      this.quizCountdownTimer = setTimeout(tick, delayMs)
    } else {
      tick()
    }
  },

  scheduleFillToRecite() {
    this.setData({ quizNextIsSubmit: false })
    this.scheduleQuizCountdown(() => {
      if (this.data.quizPhase === 'fill' && this.data.quizChecked) {
        this.startQuizRecite()
      }
    })
  },

  // 背诵评测完成后：有单词拼写题 → 进拼写；否则 → 下一题 / 提交
  scheduleAfterRecite() {
    const spell = getActiveQuizSpell(this)
    if (hasSpellStep(spell)) {
      const patch = this.patchQuizStepPlan(spell, 'recite')
      this.setData(Object.assign({ quizNextIsSubmit: false }, patch))
      // 等评分庆祝动画（彩带 2s）播完再起倒计时，避免两者叠在一起
      this.scheduleQuizCountdown(() => {
        if (this.data.quizPhase === 'recite') {
          this.startQuizSpell()
        }
      }, QUIZ_CELEBRATE_DELAY_MS)
      return
    }
    this.setData({ quizNextIsSubmit: this.data.quizIndex >= this.data.quizQuestions.length - 1 })
    this.scheduleQuizCountdown(() => {
      if (this.data.quizPhase === 'recite') {
        this.goToNextQuizQuestion()
      }
    }, QUIZ_CELEBRATE_DELAY_MS)
  },

  scheduleSpellToNext() {
    this.setData({ quizNextIsSubmit: this.data.quizIndex >= this.data.quizQuestions.length - 1 })
    this.scheduleQuizCountdown(() => {
      if (this.data.quizPhase === 'spell') {
        this.goToNextQuizQuestion()
      }
    })
  },

  startQuizRecite() {
    if (this.data.quizHasFill) {
      if (!this.data.quizChecked || this.data.quizPhase !== 'fill') {
        return
      }
    } else if (this.data.quizPhase !== 'recite') {
      return
    }

    if (this.quizAudio) {
      this.quizAudio.stop()
    }

    this.setData({
      quizPhase: 'recite',
      quizReciteScore: '',
      playing: false,
      quizAudioPlaying: false
    }, () => {
      this.syncQuizStepList('recite')
    })
  },

  startQuizSpell() {
    if (this.data.quizPhase !== 'recite') {
      return
    }
    this.cancelQuizReciteMedia()
    if (this.quizAudio) {
      this.quizAudio.stop()
    }

    this.setData({
      quizPhase: 'spell',
      quizSpellSelectedIndex: null,
      quizSpellCorrect: false,
      quizSpellFilled: '',
      playing: false,
      quizAudioPlaying: false
    }, () => {
      this.syncQuizStepList('spell')
      this.playQuizSpellAudio()
    })
  },

  playQuizSpellAudio() {
    const spell = this.data.quizSpell
    const audio = spell && (spell.audio || buildVoiceUrl(spell.word))
    if (!audio || !this.quizAudio) {
      return
    }
    this.quizAudio.stop()
    this.quizAudio.src = audio
    this.quizAudio.play()
    this.setData({ playing: true, quizAudioPlaying: true })
  },

  onQuizSpellOptionTap(e) {
    if (this.data.quizPhase !== 'spell' || this.data.quizSpellSelectedIndex != null) {
      return
    }
    const index = Number(e.currentTarget.dataset.index)
    const spell = this.data.quizSpell
    const option = spell && spell.options && spell.options[index]
    if (!option) {
      return
    }

    const correct = !!option.isAnswer
    const records = (this.data.quizRecords || []).slice()
    records[this.data.quizIndex] = Object.assign({}, records[this.data.quizIndex], {
      spellCorrect: correct
    })

    this.setData({
      quizSpellSelectedIndex: index,
      quizSpellCorrect: correct,
      quizSpellFilled: option.text,
      quizRecords: records
    })

    if (!correct) {
      const runtime = this.quizRuntimeQuestion || {}
      this.rememberWrongQuizWord({
        unitId: runtime.unitId || this.targetUnitId || '',
        wordId: runtime.wordId || '',
        word: spell.word || runtime.word || '',
        correct: false
      })
    }

    this.scheduleSpellToNext()
  },

  onQuizMediaBeforePlay() {
    if (this.quizAudio) {
      this.quizAudio.stop()
    }
    if (player.active && player.playing) {
      player.pause()
    }
    this.setData({ playing: false, quizAudioPlaying: false })
  },

  onQuizReciteResult(e) {
    const score = e.detail && e.detail.score
    if (score == null || score === '') {
      return
    }

    const question = this.quizRuntimeQuestion
    const records = (this.data.quizRecords || []).slice()
    const record = {}
    if (this.data.quizHasFill && question) {
      record.fillCorrect = this.isQuizCorrect(question)
    }
    record.reciteScore = Number(score)
    records[this.data.quizIndex] = Object.assign({}, records[this.data.quizIndex], record)

    this.setData({
      quizReciteScore: score,
      quizMarking: false,
      quizRecords: records
    }, () => {
      this.scheduleAfterRecite()
    })
  },

  onQuizReciteStateChange(e) {
    const state = e.detail && e.detail.state
    const marking = state === 2 || state === 4
    if (marking !== this.data.quizMarking) {
      this.setData({ quizMarking: marking })
    }

    if (state !== 0 && this.quizAudio) {
      this.quizAudio.stop()
      this.setData({ playing: false })
    }
  },

  onQuizReciteUnauthorized(e) {
    this.onMediaUnauthorized(e)
  },

  goToNextQuizQuestion() {
    this.submitQuizWordResult()
    const nextIndex = this.data.quizIndex + 1
    const total = this.data.quizQuestions.length || 1
    if (nextIndex >= this.data.quizQuestions.length) {
      this.goFinishPage()
      return
    }

    this.setData({
      quizAnsweredCount: nextIndex,
      quizProgressPercent: Math.round(nextIndex * 100 / total)
    })
    this.showQuizQuestion(nextIndex, true)
  },

  goFinishPage() {
    const unit = (this.data.units && this.data.units[this.data.unitIndex]) || {}
    const unitId = unit.unitId || this.targetUnitId || ''
    const unitSort = unit.sort || 1
    const total = this.data.quizQuestions.length || 0
    const scoreRate = computeQuizScoreRate(this.data.quizRecords, total)
    const url = appendReturnTabQuery(
      '/pages/finish/today?unitId=' + unitId +
        '&unitSort=' + unitSort +
        '&taskType=listening' +
        '&resBookId=' + encodeURIComponent(this.resBookId || '') +
        '&name=' + encodeURIComponent(this.resBookName || '') +
        '&scoreRate=' + scoreRate,
      this.returnTab
    )
    wx.redirectTo({ url })
  },

  openQuizReport() {
    const unit = (this.data.units && this.data.units[this.data.unitIndex]) || {}
    const total = this.data.quizQuestions.length || 0
    const records = this.data.quizRecords || []
    const fillCorrect = records.filter(item => item && item.fillCorrect).length
    const reciteScores = records
      .map(item => item && item.reciteScore)
      .filter(score => score != null && score !== '')
    const avgRecite = reciteScores.length
      ? Math.round(reciteScores.reduce((sum, score) => sum + Number(score), 0) / reciteScores.length)
      : 0
    const spellRecords = records.filter(item => item && item.spellCorrect != null)
    const spellCorrect = spellRecords.filter(item => item.spellCorrect === true).length
    const spellRate = spellRecords.length
      ? Math.round(spellCorrect * 100 / spellRecords.length)
      : 0
    const accuracy = total
      ? Math.round(fillCorrect * 100 / total)
      : 0

    const summary = 'Listening quiz · ' + accuracy + '% fill · ' + avgRecite + ' recite' +
      (spellRecords.length ? ' · ' + spellRate + '% spell' : '')
    const query = [
      'sort=' + (unit.sort || 1),
      'words=' + total,
      'unitId=' + encodeURIComponent(unit.unitId || this.targetUnitId || ''),
      'en=' + encodeURIComponent(summary),
      'zh=' + encodeURIComponent(this.data.unitName || '关卡小测')
    ].join('&')

    wx.navigateTo({ url: '/pages/report/report?' + query })
  },

  /* ----------------------------- 听力小测音频 ----------------------------- */

  initQuizAudio() {
    const audio = wx.createInnerAudioContext({ useWebAudioImplement: false })
    this.quizAudio = audio
    audio.onEnded(() => {
      this.setData({ playing: false, quizAudioPlaying: false })
    })
    audio.onError(res => {
      console.log('[listen] quiz audio error', res)
      this.setData({ playing: false, quizAudioPlaying: false })
    })
  },

  /* ----------------------------- 播放控制（委托全局单例） ----------------------------- */

  togglePlay() {
    player.toggle()
  },

  playPrev() {
    player.prev()
  },

  playNext() {
    player.next()
  },

  maybeStartListenGuide() {
    if (this.data.quizMode || this.listenGuideStarted || hasCompletedListenGuide()) {
      return
    }
    const tracks = this.data.tracks || []
    const guideTargetIndex = findGuideTrackIndex(tracks)
    if (guideTargetIndex < 0) {
      return
    }
    this.listenGuideStarted = true
    this.listenGuideTargetIndex = guideTargetIndex
    this.setData({
      listenGuideActive: true,
      listenGuideStep: 'swipe',
      currentPage: 0
    })
  },

  advanceListenGuideToEvaluate() {
    const index = this.listenGuideTargetIndex
    if (index == null || index < 0) {
      this.finishListenGuide()
      return
    }
    this.clearListenGuideRecordTimer()
    this.setData({ listenGuideStep: 'sentence' })
    if (this.data.playing) {
      player.pause()
    }
    player.focusTrack(index)
    this.scrollToIndex(index)
    setTimeout(() => this.measureListenGuideSentenceSpot(index), 320)
  },

  measureListenGuideSentenceSpot(index) {
    if (!this.data.listenGuideActive || this.data.listenGuideStep !== 'sentence') {
      return
    }
    const q = this.createSelectorQuery()
    q.select('#track-' + index).boundingClientRect()
    q.exec(res => {
      const item = res && res[0]
      if (!item || !item.width) {
        return
      }
      const pad = 10
      const top = Math.max(item.top - pad, 8)
      const left = Math.max(item.left + 20, 8)
      const width = Math.max(item.width - 40, 0)
      const height = item.height + pad * 2
      const winH = wx.getStorageSync('windowHeight') || 667
      let placement = 'below'
      let calloutTop = top + height + 22
      if (calloutTop > winH - 250) {
        placement = 'above'
        calloutTop = Math.max(top - 150, 12)
      }
      this.setData({
        listenGuideSpot: { top, left, width, height, micX: 0, micY: 0, calloutTop, placement }
      })
    })
  },

  // 量取展开后的跟读卡片矩形，换算成遮罩聚光、麦克风点按涟漪与教练气泡位置
  measureListenGuideSpot() {
    if (!this.data.listenGuideActive) {
      return
    }
    const q = this.createSelectorQuery()
    q.select('.follow-card').boundingClientRect()
    q.select('.follow-media').boundingClientRect()
    q.exec(res => {
      const card = res && res[0]
      const media = res && res[1]
      if (!card || !card.width) {
        return
      }
      const pad = 8
      const top = Math.max(card.top - pad, 8)
      const left = Math.max(card.left - pad, 8)
      const width = card.width + pad * 2
      const height = card.height + pad * 2
      // 点按涟漪锚在麦克风（media 控件行的视觉中心）
      const micX = media && media.width
        ? media.left + media.width / 2
        : left + width / 2
      const micY = media && media.height
        ? media.top + media.height / 2
        : top + height / 2
      const winH = wx.getStorageSync('windowHeight') || 667
      // 默认教练气泡放卡片下方，空间不足则翻到上方
      let placement = 'below'
      let calloutTop = top + height + 24
      if (calloutTop > winH - 260) {
        placement = 'above'
        calloutTop = Math.max(top - 150, 12)
      }
      this.setData({
        listenGuideSpot: { top, left, width, height, micX, micY, calloutTop, placement }
      })
    })
  },

  clearListenGuideRecordTimer() {
    if (this.listenGuideRecordTimer) {
      clearTimeout(this.listenGuideRecordTimer)
      this.listenGuideRecordTimer = null
    }
  },

  onListenGuideAudioEnd() {
    if (!this.data.listenGuideActive || this.data.listenGuideStep !== 'evaluate') {
      return
    }
    this.clearListenGuideRecordTimer()
    this.gateListenGuideRecordPermission()
  },

  // 听完标准音后，先确认录音授权再进入跟读：
  // 已授权→直接录音；从未询问→第4步弹「开启麦克风」；曾拒绝→第5步引导去设置。
  // 把授权拆成显式引导步骤，既解释了用途，也避开了「刚授权就 start 抢跑」的首次失败。
  gateListenGuideRecordPermission() {
    wx.getSetting({
      success: ({ authSetting }) => {
        if (authSetting && authSetting['scope.record']) {
          // 已授权：直接进入录音，不打断
          this.enterListenGuideRecord()
        } else {
          // 未授权 / 曾拒绝：先展示解释气泡，由用户点按钮再走授权
          this.showListenGuidePermissionStep('permission')
        }
      },
      fail: () => {
        this.enterListenGuideRecord()
      }
    })
  },

  showListenGuidePermissionStep(step) {
    if (!this.data.listenGuideActive) {
      return
    }
    this.setData({ listenGuideStep: step }, () => {
      this.measureListenGuideSpot()
    })
  },

  // 点「开启麦克风」：直接复用 media.startRecord 的成熟授权链路——
  // 未授权会弹原生授权框、授权后录音；若被拒绝，media 抛 unauthorized，
  // 由 onMediaUnauthorized 收掉引导并弹「去设置」。不再自己写 authorize，避免回调不稳卡死。
  onListenGuidePermissionAllow() {
    this.enterListenGuideRecord()
  },

  enterListenGuideRecord() {
    if (!this.data.listenGuideActive) {
      return
    }
    this.setData({ listenGuideStep: 'record' }, () => {
      setTimeout(() => {
        this.measureListenGuideSpot()
        const media = this.selectComponent('.follow-media')
        if (media && typeof media.startRecord === 'function') {
          media.startRecord()
        }
      }, 280)
    })
    // 正常情况下录音进入 RECORDING 会由 onMediaStateChange 收掉引导；
    // 兜底：若 4.5s 内没能开录（授权抢跑/引擎异常），也把引导收掉，避免卡死。
    this.clearListenGuideRecordTimer()
    this.listenGuideRecordTimer = setTimeout(() => {
      this.listenGuideRecordTimer = null
      if (this.data.listenGuideActive) {
        this.finishListenGuide()
      }
    }, 4500)
  },

  syncFollowRecordingOverlay(options) {
    syncRecordingOverlay(this, {
      positionOnly: !!(options && options.positionOnly),
      overlayKey: 'followRecordingOverlay',
      mediaSelector: '.follow-media',
      fallbackSelector: '.follow-recite-panel',
      topOffsetRpx: 20,
      canSync: () => this.data.expandedIndex >= 0
    })
  },

  hideFollowRecordingOverlay() {
    hideRecordingOverlay(this, { overlayKey: 'followRecordingOverlay' })
  },

  onFollowRecordingOverlayTap() {
    const media = this.selectComponent('.follow-media')
    if (media && typeof media.record === 'function') {
      media.record()
    }
  },

  finishListenGuide() {
    if (!this.data.listenGuideActive) {
      return
    }
    this.clearListenGuideRecordTimer()
    markListenGuideDone()
    this.setData({
      listenGuideActive: false,
      listenGuideStep: '',
      listenGuideSpot: { top: 0, left: 0, width: 0, height: 0, micX: 0, micY: 0, calloutTop: 0, placement: 'below' }
    })
  },

  onFollowMediaAudioEnd() {
    this.onListenGuideAudioEnd()
  },

  onTrackTap(e) {
    if (
      this.data.listenGuideActive &&
      (this.data.listenGuideStep === 'swipe' || this.data.listenGuideStep === 'evaluate')
    ) {
      return
    }
    const index = Number(e.currentTarget.dataset.index)
    if (this.data.listenGuideActive && this.data.listenGuideStep === 'sentence') {
      if (index !== this.listenGuideTargetIndex) {
        return
      }
      this.setData({ listenGuideStep: 'evaluate', listenGuideSpot: { top: 0, left: 0, width: 0, height: 0, micX: 0, micY: 0, calloutTop: 0, placement: 'below' } })
    }
    // 再次点击已展开的句子：收起
    if (this.data.expandedIndex === index) {
      this.hideFollowRecordingOverlay()
      this.setData({ expandedIndex: -1 })
      return
    }
    // 点击文字直接展开：暂停随身听，同步进度条到该条，展开后由 media 自动播放标准音
    if (this.data.playing) {
      player.pause()
    }
    player.focusTrack(index)
    this.setData({ expandedIndex: index }, () => {
      setTimeout(() => {
        this.scrollToIndex(index)
        if (this.data.listenGuideActive && this.data.listenGuideStep === 'evaluate') {
          setTimeout(() => this.measureListenGuideSpot(), 460)
          this.listenGuideRecordTimer = setTimeout(() => {
            if (this.data.listenGuideActive && this.data.listenGuideStep === 'evaluate') {
              this.onListenGuideAudioEnd()
            }
          }, 8000)
        }
      }, 80)
    })
  },

  /* ----------------------------- 跟读测评（复用 media 组件 / 驰声引擎） ----------------------------- */

  // 跟读/试听/录音时暂停随身听示范音，避免与跟读音重叠
  onMediaStateChange(e) {
    if (e.detail.state !== 0 && this.data.playing) {
      player.pause()
    }
    if (this.data.listenGuideActive && e.detail.state === 2) {
      this.finishListenGuide()
    }
    if (e.detail.state === 2) {
      setTimeout(() => this.syncFollowRecordingOverlay(), 120)
      setTimeout(() => this.syncFollowRecordingOverlay({ positionOnly: true }), 360)
    } else {
      this.hideFollowRecordingOverlay()
    }
  },

  // 评测返回：缓存该句得分与逐词 detail，重新展开时回显
  onMediaResult(e) {
    const { index, score, detail } = e.detail
    if (index == null) {
      return
    }
    this.setData({
      ['trackScores[' + index + ']']: {
        score: score,
        detail: detail
      }
    })
  },

  // 打开「标记说明」弹窗（页码 / 句子标记 / 评分配色）
  showMarkTip() {
    this.setData({ dialog: { type: 'instruction' } })
  },

  // 录音未授权：提示去设置开启
  onMediaUnauthorized(e) {
    if (this.data.listenGuideActive) {
      this.finishListenGuide()
    }
    const dialog = (e.detail && e.detail.dialog) || {}
    wx.showModal({
      title: dialog.title || '提示',
      content: dialog.content || '未授权录音功能，无法录音评分，请完成授权。',
      confirmText: dialog.confirmText || '去授权',
      cancelText: dialog.cancelText || '取消',
      success: res => {
        if (res.confirm) {
          wx.openSetting()
        }
      }
    })
  },

  onBookCoverError() {
    this.setData({ bookCover: getFallbackBookCover() })
  },

  scrollToCurrent() {
    this.scrollToIndex(this.data.current)
  },

  // 激活/展开时把条目带进可视区——但只在被遮挡时滚动，且保留顶部留白，
  // 不再把条目硬顶到最上面（那样会丢失上下文，观感很差）
  scrollToIndex(index) {
    const q = this.createSelectorQuery()
    q.select('.lyrics').fields({ rect: true, size: true, scrollOffset: true })
    q.select('#track-' + index).boundingClientRect()
    q.exec(res => {
      const view = res && res[0]
      const item = res && res[1]
      if (!view || !item) {
        return
      }
      const margin = view.height * 0.12 // 顶部/底部留白，避免贴边
      const itemTop = item.top - view.top // 相对可视区顶部
      const itemBottom = item.bottom - view.top
      let target = view.scrollTop
      if (item.height > view.height - margin) {
        // 展开后比可视区还高：让条目顶部停在留白处，优先露出句子+面板上半
        target = view.scrollTop + itemTop - margin
      } else if (itemBottom > view.height) {
        // 下方（含展开面板）被截断：上滚刚好露出，并留底边距
        target = view.scrollTop + (itemBottom - view.height) + margin
      } else if (itemTop < margin) {
        // 顶部被截断或贴顶：下滚到留白处
        target = view.scrollTop + itemTop - margin
      } else {
        // 已在可视区内：不滚动
        return
      }
      if (target < 0) {
        target = 0
      }
      this.setData({ scrollTop: target })
    })
  },

  /* ----------------------------- 进度条 ----------------------------- */

  onSeekStart(e) {
    if (!this.data.tracks.length) {
      return
    }
    if (!this.seekRect) {
      this.measureSeekBar()
    }
    player.setSeeking(true)
    this.previewSeek(e)
  },

  onSeekMove(e) {
    this.previewSeek(e)
  },

  onSeekEnd(e) {
    const value = this.valueFromTouch(e)
    player.setSeeking(false)
    if (value != null) {
      player.seekToValue(value)
    }
  },

  valueFromTouch(e) {
    const rect = this.seekRect
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
    if (!rect || !rect.width || !touch) {
      return null
    }
    let ratio = (touch.clientX - rect.left) / rect.width
    ratio = Math.min(Math.max(ratio, 0), 1)
    return ratio * 100
  },

  // 拖动时仅更新进度条外观，不打断当前播放
  previewSeek(e) {
    const value = this.valueFromTouch(e)
    if (value != null) {
      player.previewSeek(value)
    }
  },

  /* ----------------------------- 倍速 / 循环 ----------------------------- */

  toggleSpeed() {
    player.toggleSpeed()
  },

  toggleLoop() {
    player.toggleLoop()
  },

  /* ----------------------------- 期切换面板 ----------------------------- */

  openPlaylist() {
    this.setData({ showPlaylist: true })
  },

  closePlaylist() {
    this.setData({ showPlaylist: false })
  },

  onUnitTap(e) {
    const index = Number(e.currentTarget.dataset.index)
    const unit = this.data.units[index]
    this.setData({ showPlaylist: false })
    if (!isListenUnitUnlocked(unit, index)) {
      promptVipPurchase(null)
      return
    }
    player.selectUnit(index)
  },

  noop() {},

  onSwiperChange(e) {
    const current = e.detail.current
    this.setData({ currentPage: current })
    if (
      this.data.listenGuideActive &&
      this.data.listenGuideStep === 'swipe' &&
      current === 1
    ) {
      this.advanceListenGuideToEvaluate()
    }
  },

  close() {
    if (this.closing) {
      return
    }
    if (this.data.quizMode) {
      const that = this
      this.setData({
        dialog: {
          type: 'general',
          title: '提示',
          content: '确认退出当前学习？',
          subtitle: '学习贵在坚持，每天进步一点点。',
          cancelText: '取消',
          confirmText: '确认',
          confirm: function () {
            that.closing = true
            wx.navigateBack()
          }
        }
      })
      return
    }
    this.closing = true
    this.setData({ pageAnimState: 'listen-page-leaving', showPlaylist: false })
    const pages = getCurrentPages()
    const below = pages.length > 1 ? pages[pages.length - 2] : null
    if (!below || TAB_ROUTES.indexOf(below.route) >= 0) {
      // 下层是 tab 页：switchTab 没有系统转场动画，
      // 等下滑动画播完后瞬时切回，不会露出白底页再滑走
      setTimeout(() => {
        wx.switchTab({ url: '/' + (below ? below.route : 'pages/home/home') })
      }, LISTEN_PAGE_ANIM_MS - 40)
      return
    }
    // 下层是普通页：只能 navigateBack，
    // 提前于退场动画结束触发返回，让系统转场与下滑尾段重叠
    setTimeout(() => {
      wx.navigateBack()
    }, LISTEN_PAGE_ANIM_MS - 80)
  }
})
