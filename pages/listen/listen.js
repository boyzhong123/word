const {
  getUnits,
  getUnitResource
} = require('../../utils/api')
const { login } = require('../../utils/login')
const {
  buildListeningQuizQuestions,
  buildReciteParts,
  instantiateQuizQuestion,
  normalizeUnitResource
} = require('./listen-quiz')
const {
  buildMockReviewResource
} = require('../../utils/review-mock')
// 通常听力播放走全局单例（跨页持续 + 迷你播放器）；buildTracks 复用单例里的实现
const { player, buildTracks } = require('../../utils/player')

const LISTEN_PAGE_ANIM_MS = 320
// 与 app.json tabBar.list 保持一致
const TAB_ROUTES = ['pages/home/home', 'pages/me/me']
const QUIZ_NEXT_COUNTDOWN_S = 3

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

Page({
  data: {
    pageAnimState: 'listen-page-preenter',
    safeAreaBottom: Math.max((wx.getStorageSync('windowHeight') || 0) - ((wx.getStorageSync('safeArea') || {}).bottom || wx.getStorageSync('windowHeight') || 0), 0),

    loading: true,
    bookCover: '../../images/home/book-cover.png',

    // 期（单元）列表
    units: [],
    unitIndex: 0,
    unitName: '随身听',

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

    quizMode: false,
    quizQuestions: [],
    quizQuestion: null,
    quizIndex: 0,
    quizAnsweredCount: 0,
    quizProgressPercent: 0,
    quizChecked: false,
    quizResultText: '',
    quizReviewWordResults: [],
    // fill: 听音填空 | recite: 看着背诵 + 语音评测
    quizPhase: 'fill',
    quizReciteParts: [],
    quizReciteScore: '',
    quizMarking: false,
    quizNextCountdown: 0,
    quizAllDone: false,
    quizRecords: [],
    quizAudioPlaying: false
  },

  onLoad(options) {
    options = options || {}
    this.closing = false
    this.setData({ pageAnimState: 'listen-page-preenter' })
    const book = (getApp().globalData && getApp().globalData.book) || {}
    this.resBookId = options.resBookId || book.resBookId || ''
    this.targetUnitId = options.unitId || ''
    const quizMode = options.mode === 'quiz' || options.taskType === 'listening'
    // 错词复习模式：review=1，reviewUnitIds 为覆盖的关卡 id 列表。
    this.review = options.review === '1' || options.review === 1
    this.reviewUnitIds = options.reviewUnitIds
      ? decodeURIComponent(options.reviewUnitIds).split(',').filter(Boolean)
      : []
    this.setData({ quizMode, review: this.review })
    const bookCover = book.bookCover || this.data.bookCover
    if (book.bookCover) {
      this.setData({ bookCover })
    }

    if (quizMode) {
      // 听力小测：独立局部音频，不影响/不复用全局随身听
      if (player.active) {
        player.pause()
      }
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

  onShow() {
    if (this.closing) {
      return
    }
    this.setData({ pageAnimState: 'listen-page-preenter' })
    wx.nextTick(() => {
      setTimeout(() => {
        if (this.closing) {
          return
        }
        this.setData({ pageAnimState: 'listen-page-enter' })
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
    this.setData({
      loading: !s.active,
      unitName: s.unitName,
      bookCover: s.bookCover,
      units: s.units,
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
      this.setData({ units: list })
      this.loadUnit(Math.max(targetIndex, 0), false)
    })
  },

  // 错词复习用假数据（结构同 getUnitResource），后期换成真实错词接口即可。
  // 假数据没有音频，tracks 为空，因此只走 quizMode 的听力填空。
  loadReviewUnit() {
    const source = buildMockReviewResource(this.reviewUnitIds)
    this.setData({
      loading: false,
      units: [],
      unitIndex: 0,
      unitName: '错词复习',
      tracks: buildTracks(source),
      current: 0,
      progress: 0,
      currentTime: '00:00',
      showPlaylist: false,
      quizQuestions: buildListeningQuizQuestions(source),
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

  loadUnit(index, autoPlay, toEnd) {
    const unit = this.data.units[index]
    if (!unit) {
      return
    }
    if (unit.needVip) {
      wx.showToast({ title: '该期为会员内容', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    getUnitResource(unit.unitId).then(list => {
      const source = normalizeUnitResource(list)
      const tracks = buildTracks(source)
      const unitName = (source[0] && source[0].unit && source[0].unit.unitName) || unit.unitName || ('第' + (unit.sort || index + 1) + '期')

      const quizQuestions = buildListeningQuizQuestions(source)

      this.setData({
        loading: false,
        unitIndex: index,
        unitName,
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

  showQuizQuestion(index, autoPlay) {
    this.clearQuizTimers()
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

    this.setData({
      quizIndex: index,
      quizPhase: 'fill',
      quizReciteParts: buildReciteParts(sourceQuestion.sentence),
      quizReciteScore: '',
      quizMarking: false
    })
    this.setQuizViewQuestion(question, false, '')

    if (autoPlay) {
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
      this.setQuizViewQuestion(question, true, this.getQuizResultText(correct))
      this.scheduleFillToRecite()
      this.rememberQuizWordResult(question, correct)
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
    return correct ? '全部填对了' : '再听一遍，看看哪里不同'
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

    postListeningQuizResult(payload)
  },

  rememberWrongQuizWord(payload) {
    const key = 'listeningQuizWrongWords'
    const list = wx.getStorageSync(key) || []
    const id = payload.wordId || payload.word
    const next = Array.isArray(list)
      ? list.filter(item => (item.wordId || item.word) !== id)
      : []

    next.push(Object.assign({}, payload, {
      updatedAt: Date.now()
    }))
    wx.setStorageSync(key, next)
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

  clearQuizTimers() {
    if (this.quizCountdownTimer) {
      clearInterval(this.quizCountdownTimer)
      this.quizCountdownTimer = null
    }
    this.quizCountdownDone = null
    if (this.data.quizNextCountdown) {
      this.setData({ quizNextCountdown: 0 })
    }
  },

  scheduleQuizCountdown(done) {
    this.clearQuizTimers()
    this.quizCountdownDone = done
    this.setData({ quizNextCountdown: QUIZ_NEXT_COUNTDOWN_S })
    this.quizCountdownTimer = setInterval(() => {
      const left = this.data.quizNextCountdown - 1
      if (left > 0) {
        this.setData({ quizNextCountdown: left })
        return
      }
      const onDone = this.quizCountdownDone
      this.clearQuizTimers()
      if (typeof onDone === 'function') {
        onDone()
      }
    }, 1000)
  },

  scheduleFillToRecite() {
    this.scheduleQuizCountdown(() => {
      if (this.data.quizPhase === 'fill' && this.data.quizChecked) {
        this.startQuizRecite()
      }
    })
  },

  scheduleReciteToNext() {
    this.scheduleQuizCountdown(() => {
      if (this.data.quizPhase === 'recite' && this.data.quizReciteScore) {
        this.goToNextQuizQuestion()
      }
    })
  },

  startQuizRecite() {
    if (!this.data.quizChecked || this.data.quizPhase !== 'fill') {
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
    })
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
    records[this.data.quizIndex] = {
      fillCorrect: question ? this.isQuizCorrect(question) : false,
      reciteScore: Number(score)
    }

    this.setData({
      quizReciteScore: score,
      quizMarking: false,
      quizRecords: records
    })
    this.scheduleReciteToNext()
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
    const nextIndex = this.data.quizIndex + 1
    const total = this.data.quizQuestions.length || 1
    if (nextIndex >= this.data.quizQuestions.length) {
      this.setData({
        quizAllDone: true,
        quizProgressPercent: 100,
        quizAnsweredCount: total
      })
      return
    }

    this.setData({
      quizAnsweredCount: nextIndex,
      quizProgressPercent: Math.round(nextIndex * 100 / total)
    })
    this.showQuizQuestion(nextIndex, true)
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
    const accuracy = total
      ? Math.round(fillCorrect * 100 / total)
      : 0

    const query = [
      'sort=' + (unit.sort || 1),
      'words=' + total,
      'unitId=' + encodeURIComponent(unit.unitId || this.targetUnitId || ''),
      'en=' + encodeURIComponent('Listening quiz · ' + accuracy + '% fill · ' + avgRecite + ' recite'),
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

  onTrackTap(e) {
    const index = Number(e.currentTarget.dataset.index)
    // 再次点击已展开的句子：收起
    if (this.data.expandedIndex === index) {
      this.setData({ expandedIndex: -1 })
      return
    }
    // 点击文字直接展开：暂停随身听，同步进度条到该条，展开后由 media 自动播放标准音
    if (this.data.playing) {
      player.pause()
    }
    player.focusTrack(index)
    this.setData({ expandedIndex: index }, () => {
      this.scrollToIndex(index)
    })
  },

  /* ----------------------------- 跟读测评（复用 media 组件 / 驰声引擎） ----------------------------- */

  // 跟读/试听/录音时暂停随身听示范音，避免与跟读音重叠
  onMediaStateChange(e) {
    if (e.detail.state !== 0 && this.data.playing) {
      player.pause()
    }
  },

  // 评测返回：缓存该句得分，重新展开时回显
  onMediaResult(e) {
    const { index, score } = e.detail
    if (index == null) {
      return
    }
    this.setData({
      ['trackScores[' + index + ']']: score
    })
  },

  // 录音未授权：提示去设置开启
  onMediaUnauthorized(e) {
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
    this.setData({ showPlaylist: false })
    player.selectUnit(index)
  },

  noop() {},

  onSwiperChange(e) {
    this.setData({ currentPage: e.detail.current })
  },

  close() {
    if (this.closing) {
      return
    }
    this.closing = true
    this.setData({ pageAnimState: 'listen-page-leaving' })
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
    // 下层是普通页（如小测从练习流程进入）：只能 navigateBack，
    // 提前于退场动画结束触发返回，让系统转场与下滑尾段重叠
    setTimeout(() => {
      wx.navigateBack()
    }, LISTEN_PAGE_ANIM_MS - 80)
  }
})
