const {
    getWordInfo,
    getUnitResource,
    getUnits
} = require('../../utils/api')
const {
    refreshHomePage
} = require('../../utils/util')
const {
    buildMockReviewResource
} = require('../../utils/review-mock')
const {
    computePracticeScoreRate,
    computeWordNewScoreRate
} = require('../../utils/finish-stars')
const {
    buildLevelNav
} = require('../../utils/level-nav')
const {
    normalizeProverb
} = require('../../utils/proverb-text')
const { player } = require('../../utils/player')
const { navigateToVipPurchase } = require('../../utils/vip-purchase')
const { resolveVoiceUrl } = require('../../utils/voice-url')
const {
  syncRecordingOverlay,
  hideRecordingOverlay
} = require('../../utils/recording-overlay')
const { appendReturnTabQuery } = require('../../utils/return-tab')
const {
  getTaskResumeIndex,
  submitWordStepProgress,
  submitRecitationStepProgress
} = require('../../utils/task-progress')

const PRONUNCIATION_TIPS = [
  '先发 /æ/ 音，嘴巴张大，舌尖抵下齿背',
  '接着发 /p/ 音，双唇紧闭后突然张开送气',
  '最后发 /l/ 音，舌尖抵住上齿龈，气流从舌头两侧流出'
]

const DETAIL_TAB_DEFS = [
  { key: 'enEn', label: '英译英' },
  { key: 'synonyms', label: '近义词' },
  { key: 'mnemonic', label: '联想记忆' },
  { key: 'root', label: '词根' },
  { key: 'recite', label: '背诵技巧' }
]

const WORD_HINT_VISIBLE_MS = 2000
const PAGE_TIP_NAV_GAP_PX = 8
// 跟读模式：当前词全部条目读完评分后，倒计时自动进入下一词（与小测一致）
const AUTO_NEXT_COUNTDOWN_S = 3
// media 组件评分反馈（彩带/表情）展示 2000ms 后淡出，倒计时等它播完
const AUTO_NEXT_CELEBRATE_DELAY_MS = 2200
const WORD_HINT_TOAST_IMAGES = [
  '/images/word-new/toast-known.png',
  '/images/word-new/toast-unknown.png',
  '/images/word-new/toast-mistaken.png'
]

function getPracticeProgressRatio(index, total) {
  if (!total) {
    return 0
  }
  return (index + 1) / total
}

function getPracticeProgressPercent(index, total) {
  return Math.round(getPracticeProgressRatio(index, total) * 100)
}

function getPageTipPosition(targetRect, tipRect, navRect) {
  const top = (targetRect && targetRect.top || 0) - (tipRect && tipRect.height || 0)
  const minTop = navRect && typeof navRect.bottom === 'number'
    ? navRect.bottom + PAGE_TIP_NAV_GAP_PX
    : top
  return {
    top: Math.max(top, minTop),
    left: (targetRect && targetRect.left || 0) + 5
  }
}

function normalizeWordPronunciations(word) {
  const ukSymbol = word.ukSymbol || word.enSymbol || word.britishSymbol || word.symbolUk || word.symbol
  const usSymbol = word.usSymbol || word.americanSymbol || word.symbolUs || word.symbol
  const ukAudio = word.ukAudio || word.enAudio || word.britishAudio || word.audioUk || word.audio
  const usAudio = word.usAudio || word.americanAudio || word.audioUs || word.audio

  word.pronunciations = [
    { key: 'uk', label: '英', symbol: ukSymbol || '', audio: ukAudio || '' },
    { key: 'us', label: '美', symbol: usSymbol || '', audio: usAudio || '' }
  ]
  word.activeAccent = word.activeAccent || 'uk'
}

function normalizeWordDetail(word) {
  word.synonyms = word.synonyms || word.nearSynonyms || word.similarWords || null
  word.enEnDetail = word.enEnDetail || word.enEn || word.enDefinition || word.englishDefinition || word.definitionEn || word.enExplain || ''
  word.mnemonic = word.mnemonic || word.associationMemory || ''
  word.rootDetail = word.rootDetail || word.etymology || word.root || ''
  word.recitationTips = word.recitationTips || word.pronunciationTips || PRONUNCIATION_TIPS.slice()

  if (!word.synonyms || !word.synonyms.length) {
    word.synonyms = [{
      pos: word.attribute || '',
      en: word.content || '',
      cn: word.translation || ''
    }]
  }
  if (!word.enEnDetail) {
    word.enEnDetail = '暂无英译英释义，可先通过例句理解用法。'
  }
  if (!word.mnemonic) {
    word.mnemonic = '可从词形、发音或例句场景联想记忆「' + (word.content || '') + '」。'
  }
  if (!word.rootDetail) {
    word.rootDetail = '暂无词根解析，可先通过例句理解用法。'
  }
  if (!word.recitationTips || !word.recitationTips.length) {
    word.recitationTips = PRONUNCIATION_TIPS.slice()
  }

  word.detailNavItems = DETAIL_TAB_DEFS.map(function (tab) {
    return { key: tab.key, label: tab.label }
  })
  word.activeDetailTab = word.activeDetailTab || word.detailNavItems[0].key
}

function getWordChoiceSense(word) {
  const senses = Array.isArray(word && word.senses) ? word.senses : []
  if (senses.length) {
    const first = senses[0] || {}
    const terms = Array.isArray(first.terms) ? first.terms : []
    return {
      pos: first.pos || word.attribute || '',
      terms: terms.length ? terms : [word.translation || '']
    }
  }
  const translation = (word && word.translation) || ''
  const terms = translation
    .split(/[;；,，]/)
    .map(function (term) {
      return term.trim()
    })
    .filter(Boolean)
  return {
    pos: (word && word.attribute) || '',
    terms: terms.length ? terms : [translation]
  }
}

function buildChoiceOption(item, answer) {
  const word = (item && item.word) || {}
  const sense = getWordChoiceSense(word)
  return {
    content: word.content || '',
    pos: sense.pos,
    terms: sense.terms,
    termText: sense.terms.join('；'),
    audio: word.audio || word.ukAudio || word.enAudio || '',
    isAnswer: !!answer
  }
}

function buildWordChoiceOptions(contents, currentIndex) {
  const list = Array.isArray(contents) ? contents : []
  const current = list[currentIndex]
  if (!current || !current.word) {
    return []
  }

  const seen = {}
  const answer = buildChoiceOption(current, true)
  seen[answer.content] = true
  const options = [answer]

  list.forEach(function (item, index) {
    if (index === currentIndex || !item || !item.word) {
      return
    }
    const content = item.word.content || ''
    if (!content || seen[content] || options.length >= 4) {
      return
    }
    seen[content] = true
    options.push(buildChoiceOption(item, false))
  })

  while (options.length < 4) {
    options.push({
      content: '',
      pos: 'n.',
      terms: ['再想一想'],
      termText: '再想一想',
      audio: '',
      isAnswer: false
    })
  }

  const answerIndex = Math.min(options.length - 1, currentIndex % 4)
  const answerOption = options.shift()
  options.splice(answerIndex, 0, answerOption)
  return options
}

Page({
  data: {
    loading: true,
    from: '',
    taskType: 'recitation',
    isWordNewMode: false,
    review: false,
    pronunciationTips: PRONUNCIATION_TIPS,
    navTitle: '',
    navSubtitle: '',
    playingSrc: '',
    marking: false,
    scrollHeight: wx.getStorageSync('safeArea').height - wx.getStorageSync('navigationBarHeight'),
    safeAreaBottom: wx.getStorageSync('windowHeight') - wx.getStorageSync('safeArea').bottom,
    dialog: { type: '' },
    axis: {
      'anchor-page': { text: '在书中对应的页数 x', top: 0, left: 0, hidden: 'hidden', class: 'anchor-page-tip', marginleft: 1 },
      'anchor-record': { text: '点击开始录音，请在“叮”声后开始朗读 x', top: 0, left: 0, hidden: 'hidden', class: 'anchor-record' }, 'anchor-replay': { text: '点击回放录音 x', top: 0, left: 0, hidden: 'hidden', class: 'anchor-replay' },
      'anchor-proverb': { text: '点击学习谚语 x', top: 0, left: 0, hidden: 'hidden', class: 'anchor-proverb' },
      'anchor-stress': { text: '加粗的单词需重读 x', top: 0, left: 0, hidden: 'hidden', class: 'anchor-stress' },
      'anchor-tone': { text: '句末需要升调 x', top: 0, left: 0, hidden: 'hidden', class: 'anchor-tone' }
    },
    current: 0,
    autoNextCountdown: 0,
    autoNextPaused: false,
    wordTotal: 0,
    contents: [],
    needVip: 0,
    innerAudioContext: null,
    recordingOverlay: { active: false, top: 0, left: 0, width: 0, height: 0, waveSession: 0 },
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    options = options || {}
    const taskType = options.taskType === 'word' ? 'word' : 'recitation'
    this.setData({
      taskType,
      isWordNewMode: taskType === 'word'
    })
    if (taskType === 'word') {
      this.preloadWordHintImages()
    }

    if (options && options.id) {
      this.wordId = options.id
      getWordInfo(this.wordId).then(data => {
        this.initResult(data)
        this.resBookId = data.book.resBookId
        this.resBookName = data.book.name
        let dialogObject = this.getDialogObject(data.needVip)
        const contents = [data]
        this.prepareWordChoiceOptions(contents)
        const wordTotal = 1
        this.setData({
          loading: false,
          from: 'search',
          needVip: data.needVip,
          wordTotal: wordTotal,
          dialog: dialogObject,
          contents: contents,
          ...this.getNavMeta(data, 0, wordTotal)
        })
        this.last = 0
        this.dx = 0
        if (this.data.isWordNewMode) {
          wx.nextTick(() => this.startWordReading(0))
        } else {
          this.showPageTip()
        }
      })
    } else {
      this.resBookId = options.resBookId
      this.resBookName = options.name
      this.unitId = options.unitId
      this.returnTab = options.returnTab || ''
      // 错词复习模式：review=1，reviewUnitIds 为覆盖的关卡 id 列表。
      // 待后端提供错词接口后，可据此把内容收敛到这些关卡里做错的词。
      this.review = options.review === '1' || options.review === 1
      // 今日页「免费体验关」：放行会员内容门槛，让免费用户也能完整体验第一关。
      this.trial = options.trial === '1' || options.trial === 1
      this.reviewUnitIds = options.reviewUnitIds
        ? decodeURIComponent(options.reviewUnitIds).split(',').filter(Boolean)
        : []
      this.setData({ review: this.review })
      if (this.review) {
        this.fetchReviewData()
      } else {
        this.fetchUnitData(this.unitId)
      }
    }
  },
  // 错词复习用假数据（结构同 getUnitResource），后期换成真实错词接口即可。
  fetchReviewData() {
    const data = buildMockReviewResource(this.reviewUnitIds)
    data.forEach(item => this.initResult(item))
    this.prepareWordChoiceOptions(data)
    const wordTotal = data.length
    this.setData({
      loading: false,
      current: 0,
      needVip: 0,
      wordTotal: wordTotal,
      dialog: this.getDialogObject(false),
      contents: data,
      ...this.getNavMeta(data[0], 0, wordTotal)
    })
    this.last = 0
    this.dx = 0
    if (this.data.isWordNewMode) {
      wx.nextTick(() => this.startWordReading(0))
    } else {
      this.showPageTip()
    }
  },
  fetchUnitData(unitId) {
    Promise.all([
      getUnitResource(unitId),
      this.resBookId ? getUnits(this.resBookId) : Promise.resolve(null)
    ]).then(([data, unitsData]) => {
      let vip = false
      if (Array.isArray(data)) {
          data.forEach(item => {
              this.initResult(item)
          })
          this.prepareWordChoiceOptions(data)
          vip = !data.some(item => item.needVip)
      }
      if (this.trial) {
        vip = true
      }
      const wordTotal = data.length
      const resumeIndex = getTaskResumeIndex(unitsData, unitId, this.data.taskType)
      this.progressResumeIndex = resumeIndex
      if (resumeIndex >= wordTotal && wordTotal > 0 && !this.wordId) {
        this.setData({ loading: false })
        this.goFinishPage()
        return
      }
      const startIndex = Math.min(resumeIndex, Math.max(wordTotal - 1, 0))
      const startItem = data[startIndex]
      this.setData({
        loading: false,
        current: startIndex,
        needVip: vip ? 0 : 1,
        wordTotal: wordTotal,
        dialog: this.getDialogObject(!vip),
        contents: data,
        ...this.getNavMeta(startItem, startIndex, wordTotal)
      })
      this.last = startIndex
      this.dx = 0
      this.markWordStepStarted(startIndex)
      if (this.data.isWordNewMode) {
        wx.nextTick(() => this.startWordReading(startIndex))
      } else {
        this.showPageTip()
      }
    })
  },
  getDialogObject(needVip) {
      let that = this
      return {
          type: needVip ? 'vip' : '',
          confirm: function () {
              navigateToVipPurchase(null, {
                locked: true,
                onVip: () => {
                  refreshHomePage()
                  that.setData({
                    needVip: 0
                  })
                }
              })
          }
      }
  },
  initResult(item) {
    item.selectedIndex = 0
    item.revealed = false
    item.wordNewStage = 'recognition'
    item.wordChoiceOrigin = ''
    item.wordChoiceOptions = []
    item.wordChoiceSelectedIndex = null
    item.wordChoiceCorrect = false
    item.hinted = false
    item.mistaken = false
    item.known = false
    item.readCount = 0
    item.wordHint = null
    item.wordHintLabel = ''
    this.unitSort = item.unit.sort
    if (item.word) {
      item.word.page = (item.word.pages || []).join('-')
      item.word.result = {}
      normalizeWordPronunciations(item.word)
      normalizeWordDetail(item.word)
    }
    if (Array.isArray(item.proverb)) {
      item.proverb.forEach(function (proverb) {
        proverb.result = {}
        normalizeProverb(proverb)
      })
    }
  },
  prepareWordChoiceOptions(contents) {
    if (!Array.isArray(contents)) {
      return
    }
    contents.forEach((item, index) => {
      item.wordChoiceOptions = buildWordChoiceOptions(contents, index)
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
  },
  showTipPopup() {
    this.setData({
      dialog: { type: 'instruction' }
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    player.suspendForExternalAudio('practice')
    if (this.studyNew) {
      this.studyNew = false
      this.setData({
        loading: true
      })
      this.dx = 0
      this.last = 0
      this.scrollTop = 0
      this.fetchUnitData(this.unitId)
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
      this.clearWordHintTimers()
      this.stopAutoNextCountdown()
      this.stopAudio()
      this.stopWordNewAudio()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
      player.resumeFromExternalAudio('practice')
      this.clearWordHintTimers()
      this.stopAutoNextCountdown()
      if (this.data.innerAudioContext) {
        this.data.innerAudioContext.offEnded()
        this.data.innerAudioContext.offError()
        this.data.innerAudioContext.destroy()
      }
      this.stopWordNewAudio(true)
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
        path: '/pages/practice/practice?id=' + this.wordId + "&resBookId=" + this.resBookId + '&unitId=' + this.unitId + '&name=' + this.resBookName + '&taskType=' + this.data.taskType
    }
  },
  onScroll(e) {
    this.scrollTop = e.detail.scrollTop
  },
  onItemClick(e) {
    this.hideTip()
    let index = this.data.current
    this.setData({
      ['contents[' + index + '].selectedIndex']: e.currentTarget.dataset.index
    })
    this.showTip('anchor-stress')
    this.showTip('anchor-tone')
  },
  onAudioEnd() {
    if (this.data.isWordNewMode) {
      return
    }
    this.showTip('anchor-record', '.record')
  },
  onResult(e) {
    if (!this.data.isWordNewMode) {
      this.showTip('anchor-replay', '.replay')
    }
    let index = this.data.current
    let result = {
      score: e.detail.score,
      detail: e.detail.detail,
      tempFilePath: e.detail.tempFilePath
    }
    let i = e.detail.index
    if (i == 0) {
      let proverbs = this.data.contents[index].proverb
      if (Array.isArray(proverbs) && proverbs.length > 0) {
        this.showTip('anchor-proverb', '.item')
      }
      this.setData({
        ['contents[' + index + '].word.result']: result
      })
    } else {
      wx.setStorageSync('anchor-proverb', true)
      this.setData({
        ['contents[' + index + '].proverb[' + (i - 1) + '].result']: result
      })
    }
    this.scheduleAutoNextIfDone()
  },

  // ===== 读完自动切题（跟读模式） =====
  isRecitationItemDone(item) {
    const hasScore = r => r && r.score !== undefined && r.score !== null && r.score !== ''
    if (!item || !item.word || !hasScore(item.word.result)) {
      return false
    }
    const proverbs = Array.isArray(item.proverb) ? item.proverb : []
    return proverbs.every(p => hasScore(p.result))
  },

  scheduleAutoNextIfDone() {
    if (this.data.isWordNewMode || this.data.from === 'search' || this.data.needVip) {
      return
    }
    if (this.data.autoNextPaused) {
      return
    }
    const index = this.data.current
    if (!this.isRecitationItemDone(this.data.contents[index])) {
      return
    }
    this.startAutoNextCountdown(index, AUTO_NEXT_CELEBRATE_DELAY_MS)
  },

  // 单次取消：点倒计时暂停本词的自动切换，点「进入下一词」手动切换；换词后恢复自动
  pauseAutoNext() {
    this.stopAutoNextCountdown()
    this.setData({ autoNextPaused: true })
  },

  manualGoNext() {
    this.setData({ autoNextPaused: false })
    this.goAutoNext(this.data.current)
  },

  // 立即跳过：不等倒计时走完，直接进入本词的下一步
  skipAutoNext() {
    this.stopAutoNextCountdown()
    this.setData({ autoNextCountdown: 0, autoNextPaused: false })
    this.goAutoNext(this.data.current)
  },

  startAutoNextCountdown(index, delayMs) {
    this.stopAutoNextCountdown()
    const token = this.autoNextSeq
    let left = AUTO_NEXT_COUNTDOWN_S

    const tick = () => {
      if (token !== this.autoNextSeq || this.data.current !== index) {
        return
      }
      this.setData({ autoNextCountdown: left })
      if (left <= 0) {
        this.goAutoNext(index)
        return
      }
      left -= 1
      this.autoNextTimer = setTimeout(tick, 1000)
    }

    if (delayMs > 0) {
      this.autoNextTimer = setTimeout(tick, delayMs)
    } else {
      tick()
    }
  },

  stopAutoNextCountdown() {
    this.autoNextSeq = (this.autoNextSeq || 0) + 1
    if (this.autoNextTimer) {
      clearTimeout(this.autoNextTimer)
      this.autoNextTimer = null
    }
    if (this.data.autoNextCountdown) {
      this.setData({ autoNextCountdown: 0 })
    }
  },

  goAutoNext(index) {
    this.setData({ autoNextCountdown: 0, autoNextPaused: false })
    this.reportRecitationStep(index)
    if (index < this.data.contents.length - 1) {
      this.changeRecitationIndex(index + 1)
      return
    }
    if (!this.wordId) {
      this.goFinishPage()
    }
  },
  back() {
    this.setData({
      dialog: {
        type: 'general', title: '提示', content: '确认退出当前学习？', subtitle: '学习贵在坚持，每天进步一点点。', cancelText: '取消', confirmText: '确认', confirm: function () {
          wx.navigateBack()
        }
      }
    })
  },
  unauthorized(e) {
    this.setData({
      dialog: e.detail.dialog
    })
  },

  syncRecordingOverlay(options) {
    syncRecordingOverlay(this, {
      positionOnly: !!(options && options.positionOnly),
      overlayKey: 'recordingOverlay',
      mediaSelector: '.media',
      topOffsetRpx: 20
    })
  },

  hideRecordingOverlay() {
    hideRecordingOverlay(this, { overlayKey: 'recordingOverlay' })
  },

  onRecordingOverlayTap() {
    const media = this.selectComponent('.media')
    if (media && typeof media.record === 'function') {
      media.record()
    }
  },

  noop() {},
  onMediaStateChange(e) {
    if (e.detail.state != 0) {
        this.stopAudio()
        // 播放/录音/评分中暂停自动切题；回到空闲后若本词已读完会重新计时
        this.stopAutoNextCountdown()
    } else {
        this.scheduleAutoNextIfDone()
    }
    if (e.detail.state === 2) {
      setTimeout(() => this.syncRecordingOverlay(), 120)
      setTimeout(() => this.syncRecordingOverlay({ positionOnly: true }), 360)
    } else {
      this.hideRecordingOverlay()
    }
    switch (e.detail.state) {
      case 2:
        this.setData({
          'axis.anchor-record.hidden': 'hidden',
          'axis.anchor-replay.hidden': 'hidden'
        })
        break
      case 3:
        this.setData({
          'axis.anchor-replay.hidden': 'hidden'
        })
        break
      case 4:
        this.setData({
          marking: true
        })
        break
      default:
        this.setData({
          marking: false
        })
        break
    }
  },
  hideTip(anchor) {
    if (anchor === 'anchor-page-tip') {
      anchor = 'anchor-page'
    }
    if (anchor) {
      this.setData({
        ['axis.' + anchor + '.hidden']: 'hidden'
      })
    } else {
      const tempAxis = this.data.axis
      for (const key in tempAxis) {
        tempAxis[key].hidden = 'hidden'
      }
      this.setData({
        'axis': tempAxis
      })
    }
  },
  showPageTip() {
    if (this.data.isWordNewMode) {
      return
    }
    let query = this.createSelectorQuery()
    query.select('.scroll-container').boundingClientRect()
    query.select('.practice-nav').boundingClientRect()
    if (!wx.getStorageSync('anchor-page')) {
      query.select('.anchor-page-tip').boundingClientRect()
      query.select('.anchor-page').boundingClientRect()
    }
    query.exec(res => {
      this.scrollviewTop = res[0].top
      this.scrollTop = 0
      const navRect = res[1]
      const tipRect = res[2]
      const targetRect = res[3]
      if (targetRect && targetRect.width > 3) {
        const position = getPageTipPosition(targetRect, tipRect, navRect)
        wx.setStorageSync('anchor-page', true)
        this.setData({
          'axis.anchor-page.top': position.top,
          'axis.anchor-page.left': position.left,
          'axis.anchor-page.hidden': 'visible'
        })
      }
    })
  },
  showTip(anchor, select) {
    if (this.data.isWordNewMode) {
      return
    }
    let query = wx.createSelectorQuery()
    if (!wx.getStorageSync(anchor)) {
      switch (anchor) {
        case 'anchor-stress':
        case 'anchor-tone':
          query.selectAll('.' + anchor).boundingClientRect(res => {
            if (res.length > 1) {
              wx.setStorageSync(anchor, true)
              this.setData({
                ['axis.' + anchor + '.top']: res[1].top - res[0].height - this.scrollviewTop + this.scrollTop,
                ['axis.' + anchor + '.left']: res[1].left + res[1].width / 2 - res[0].width / 2,
                ['axis.' + anchor + '.hidden']: 'visible'
              })
            }
          }).exec()
          break
        default:
          query.select('.' + anchor).boundingClientRect()
          switch (anchor) {
            case 'anchor-record':
            case 'anchor-replay':
              query.in(this.selectComponent('.media')).select(select).boundingClientRect()
              break
            default:
              query.select(select).boundingClientRect()
              break
          }
          query.exec(res => {
            wx.setStorageSync(anchor, true)
            this.setData({
              ['axis.' + anchor + '.top']: res[1].top - res[0].height - this.scrollviewTop + this.scrollTop - 4,
              ['axis.' + anchor + '.left']: res[1].left + res[1].width / 2 - res[0].width / 2,
              ['axis.' + anchor + '.hidden']: 'visible'
            })
          })
          break
      }
    }
  },
  disable() {
      //评分中，除了返回按钮，其他均不能点击，知道录音结果返回
      // 非vip不能滑
      console.log('disable')
  },
  showVip() {
    this.setData({
        dialog: this.getDialogObject(1)
    })
  },
  swiperChanged(e) {
    const detail = (e && e.detail) || {}
    const current = detail.current
    const source = detail.source || ''
    // disable-touch 在开发者工具/部分机型不可靠；学习模式拦截手指滑动，只保留代码切题（自动下一词）。
    if (this.data.from !== 'search' && (
      source === 'touch' ||
      source === 'touch-out-of-bounds' ||
      (source === '' && this._allowRecitationSwiperChange !== current)
    )) {
      const revertTo = Number.isFinite(this.last) ? this.last : this.data.current
      if (current !== revertTo) {
        this.setData({ current: revertTo })
      }
      return
    }
    if (this._allowRecitationSwiperChange === current) {
      this._allowRecitationSwiperChange = null
    }
    this.hideTip()
    this.stopAutoNextCountdown()
    const item = this.data.contents[current]
    this.setData(Object.assign({
      current: current,
      autoNextPaused: false
    }, this.getNavMeta(item, current)))
  },
  touchMove(e) {
    this.dx = e.detail.dx
  },
  animationfinish() {
    this.last = this.data.current
    this.dx = 0
  },
  touchEnd(e) {
    // 学习模式不在最后一词用手势提交；跟搜索查词一致走按钮/自动流程。
    if (this.data.from !== 'search') {
      return
    }
    if (!this.wordId && this.last == this.data.contents.length - 1 && this.dx > 20) {
      this.goFinishPage()
    }
  },
  onRecitationTouchStart(e) {
    const touch = e.touches && e.touches[0]
    if (!touch) {
      return
    }
    this._recitationTouchStartX = touch.pageX
    this._recitationTouchStartY = touch.pageY
  },
  onRecitationTouchEnd(e) {
    // 学习模式下不再支持滑动切题，读完后倒计时自动切换；搜索查词保留滑动
    if (this.data.from !== 'search') {
      return
    }
    if (this.data.needVip || this.data.marking) {
      return
    }
    const touch = e.changedTouches && e.changedTouches[0]
    if (!touch || this._recitationTouchStartX == null) {
      return
    }
    const dx = touch.pageX - this._recitationTouchStartX
    const dy = touch.pageY - this._recitationTouchStartY
    this._recitationTouchStartX = null
    this._recitationTouchStartY = null
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) {
      return
    }
    const current = this.data.current
    const total = this.data.contents.length
    if (dx < 0) {
      if (current < total - 1) {
        this.changeRecitationIndex(current + 1)
      }
      return
    }
    if (!this.wordId && current === total - 1) {
      this.goFinishPage()
      return
    }
    if (current > 0) {
      this.changeRecitationIndex(current - 1)
    }
  },
  changeRecitationIndex(next) {
    if (next < 0 || next >= this.data.contents.length || next === this.data.current) {
      return
    }
    this.hideTip()
    this.stopAutoNextCountdown()
    const item = this.data.contents[next]
    this._allowRecitationSwiperChange = next
    this.setData(Object.assign({
      current: next,
      autoNextPaused: false
    }, this.getNavMeta(item, next)))
    this.last = next
    this.dx = 0
    this.markWordStepStarted(next)
  },
  markWordStepStarted(index) {
    this._wordStepStartedAt = Date.now()
    this._wordStepStartedIndex = index
  },

  getWordStepElapsedSeconds(index) {
    if (this._wordStepStartedIndex !== index || !this._wordStepStartedAt) {
      return undefined
    }
    return Math.max(1, Math.round((Date.now() - this._wordStepStartedAt) / 1000))
  },

  reportWordStep(index) {
    if (!this.data.isWordNewMode || this.wordId || this.data.from === 'search' || this.data.needVip) {
      return
    }
    const item = this.data.contents[index]
    if (!item) {
      return
    }
    submitWordStepProgress({
      item,
      unitId: this.unitId,
      resBookId: this.resBookId,
      wordIndex: index,
      resumeFrom: this.progressResumeIndex || 0,
      timeSpentSeconds: this.getWordStepElapsedSeconds(index)
    })
  },

  reportRecitationStep(index) {
    if (this.data.isWordNewMode || this.wordId || this.data.from === 'search' || this.data.needVip) {
      return
    }
    if (!this.isRecitationItemDone(this.data.contents[index])) {
      return
    }
    submitRecitationStepProgress({
      item: this.data.contents[index],
      unitId: this.unitId,
      resBookId: this.resBookId,
      wordIndex: index,
      resumeFrom: this.progressResumeIndex || 0,
      durationSeconds: this.getWordStepElapsedSeconds(index)
    })
  },

  goFinishPage() {
    const scoreRate = this.data.isWordNewMode
      ? computeWordNewScoreRate(this.data.contents)
      : computePracticeScoreRate(this.data.contents)
    const url = appendReturnTabQuery(
      '../finish/today?unitId=' + this.unitId +
        '&unitSort=' + this.unitSort +
        '&taskType=' + (this.data.taskType || 'recitation') +
        '&resBookId=' + encodeURIComponent(this.resBookId || '') +
        '&name=' + encodeURIComponent(this.resBookName || '') +
        '&scoreRate=' + scoreRate,
      this.returnTab
    )
    wx.navigateTo({ url })
  },
  getNavMeta(item, index, total) {
    const wordTotal = total || this.getPracticeWordTotal()
    return buildLevelNav(item, index, wordTotal, {
      review: this.data.review,
      unitSort: this.unitSort
    })
  },
  getPracticeWordTotal() {
    return Number(this.data.wordTotal) || this.data.contents.length || 0
  },
  getActiveAccentAudio(index) {
    const item = this.data.contents[index]
    if (!item || !item.word || !item.word.pronunciations) {
      return ''
    }
    const accent = item.word.pronunciations.find(function (pron) {
      return pron.key === item.word.activeAccent
    }) || item.word.pronunciations[0]
    return accent ? accent.audio : ''
  },
  getWordContent(index) {
    const item = this.data.contents[index]
    return item && item.word ? item.word.content : ''
  },
  resolveWordNewAudio(index, src, text) {
    const content = text || this.getWordContent(index)
    if (!content) {
      return Promise.resolve(src || '')
    }
    return resolveVoiceUrl(content, {
      preferredUrl: src,
      fallbackUrl: src
    })
  },
  getExampleAudio(index) {
    const item = this.data.contents[index]
    if (!item || !item.proverb || !item.proverb.length) {
      return ''
    }
    return item.proverb[0].audio || ''
  },
  stopWordNewAudio(destroy) {
    if (!this.wordNewAudio) {
      return
    }
    this.wordNewAudio.stop()
    if (destroy) {
      this.wordNewAudio.destroy()
      this.wordNewAudio = null
    }
    this.setData({ playingSrc: '' })
  },
  playWordNewAudio(src, onEnded, playingSrc) {
    if (!src) {
      if (onEnded) {
        onEnded()
      }
      return
    }
    if (!this.wordNewAudio) {
      this.wordNewAudio = wx.createInnerAudioContext({
        useWebAudioImplement: false
      })
      this.wordNewAudio.onEnded(() => {
        const callback = this._wordNewAudioEndCb
        this._wordNewAudioEndCb = null
        this.setData({ playingSrc: '' })
        if (callback) {
          callback()
        }
      })
      this.wordNewAudio.onError(() => {
        this._wordNewAudioEndCb = null
        this.setData({ playingSrc: '' })
      })
    }
    this._wordNewAudioEndCb = onEnded || null
    this.wordNewAudio.stop()
    this.setData({ playingSrc: playingSrc || src })
    this.wordNewAudio.src = src
    this.wordNewAudio.play()
  },
  async playResolvedWordNewAudio(index, src, onEnded, text) {
    const audio = await this.resolveWordNewAudio(index, src, text)
    this.playWordNewAudio(audio, onEnded, src || audio)
  },
  // 三个点分别对应：问答页读词、详情页读词、详情页读例句
  setWordReadCount(index, count) {
    const item = this.data.contents[index]
    if (!item || item.readCount >= count) {
      return
    }
    this.setData({
      ['contents[' + index + '].readCount']: count
    })
  },
  startWordReading(index) {
    const item = this.data.contents[index]
    if (!item || item.readCount >= 1) {
      return
    }
    this.setData({
      ['contents[' + index + '].readCount']: 1
    })
    this.playResolvedWordNewAudio(index, this.getActiveAccentAudio(index))
  },
  playDetailIntro(index) {
    this.setWordReadCount(index, 2)
    this.playResolvedWordNewAudio(index, this.getActiveAccentAudio(index), () => {
      const exampleAudio = this.getExampleAudio(index)
      if (exampleAudio) {
        this.setWordReadCount(index, 3)
        this.playWordNewAudio(exampleAudio)
      }
    })
  },
  playExampleAudio(index) {
    this.playWordNewAudio(this.getExampleAudio(index))
  },
  playWordAudio(e) {
    this.playResolvedWordNewAudio(this.data.current, e.currentTarget.dataset.src)
  },
  switchWordAccent(e) {
    const index = this.data.current
    const key = e.currentTarget.dataset.key
    const src = e.currentTarget.dataset.src
    this.setData({
      ['contents[' + index + '].word.activeAccent']: key
    })
    if (src) {
      this.playResolvedWordNewAudio(index, src)
    }
  },
  showHint() {
    const index = this.data.current
    if (!this.data.contents[index].hinted) {
      this.setData({
        ['contents[' + index + '].hinted']: true
      })
    }
    this.playExampleAudio(index)
  },
  preloadWordHintImages() {
    WORD_HINT_TOAST_IMAGES.forEach((src) => {
      wx.getImageInfo({ src })
    })
  },
  clearWordHintTimers() {
    if (this._wordHintHideTimer) {
      clearTimeout(this._wordHintHideTimer)
      this._wordHintHideTimer = null
    }
    this._wordHintDone = null
  },
  hideWordHint(index, onDone) {
    this.setData({
      ['contents[' + index + '].wordHint']: null,
      ['contents[' + index + '].wordHintLabel']: ''
    })
    if (onDone) {
      onDone()
    }
  },
  showWordHint(index, type, onDone) {
    const hintMap = {
      known: '继续保持',
      unknown: '一起巩固',
      mistaken: '记错了'
    }
    this.clearWordHintTimers()
    this._wordHintDone = onDone || null
    this.setData({
      ['contents[' + index + '].wordHint']: type,
      ['contents[' + index + '].wordHintLabel']: hintMap[type] || hintMap.unknown
    })
    this._wordHintHideTimer = setTimeout(() => {
      const done = this._wordHintDone
      this._wordHintHideTimer = null
      this._wordHintDone = null
      this.hideWordHint(index, done)
    }, WORD_HINT_VISIBLE_MS)
  },
  revealWord(index, known) {
    this.setData({
      ['contents[' + index + '].revealed']: true,
      ['contents[' + index + '].wordNewStage']: 'detail',
      ['contents[' + index + '].known']: known
    })
    this.playDetailIntro(index)
  },
  enterWordDetail(index, origin) {
    const updates = {
      ['contents[' + index + '].revealed']: true,
      ['contents[' + index + '].wordNewStage']: 'detail',
      ['contents[' + index + '].wordChoiceOrigin']: origin || ''
    }
    if (origin === 'unknown') {
      updates['contents[' + index + '].known'] = false
    }
    this.setData(updates)
    this.playDetailIntro(index)
  },
  enterWordChoice(index, origin) {
    this.setData({
      ['contents[' + index + '].wordNewStage']: 'choice',
      ['contents[' + index + '].wordChoiceOrigin']: origin || 'known',
      ['contents[' + index + '].wordChoiceSelectedIndex']: null,
      ['contents[' + index + '].wordChoiceCorrect']: false
    })
  },
  answerKnow() {
    const index = this.data.current
    this.enterWordChoice(index, 'known')
  },
  answerUnknown() {
    const index = this.data.current
    this.enterWordDetail(index, 'unknown')
  },
  continueFromWordDetail() {
    const index = this.data.current
    this.enterWordChoice(index, 'unknown')
  },
  getWordChoiceCorrectIndex(item) {
    const options = Array.isArray(item && item.wordChoiceOptions) ? item.wordChoiceOptions : []
    const index = options.findIndex(function (option) {
      return option && option.isAnswer
    })
    return index < 0 ? 0 : index
  },
  selectWordChoice(e) {
    const index = this.data.current
    const item = this.data.contents[index]
    const optionIndex = Number(e.currentTarget.dataset.index)
    const options = Array.isArray(item && item.wordChoiceOptions) ? item.wordChoiceOptions : []
    const option = options[optionIndex]
    if (!item || !option) {
      return
    }

    if (item.wordChoiceSelectedIndex !== null && item.wordChoiceSelectedIndex !== undefined) {
      if (option.audio) {
        this.playResolvedWordNewAudio(index, option.audio, null, option.content)
      }
      return
    }

    const correct = !!option.isAnswer
    const updates = {
      ['contents[' + index + '].revealed']: true,
      ['contents[' + index + '].wordChoiceSelectedIndex']: optionIndex,
      ['contents[' + index + '].wordChoiceCorrect']: correct
    }
    if (item.wordChoiceOrigin === 'known') {
      updates['contents[' + index + '].known'] = correct
      updates['contents[' + index + '].mistaken'] = !correct
    } else if (!correct) {
      updates['contents[' + index + '].mistaken'] = true
    }
    this.setData(updates)
    if (option.audio) {
      this.playResolvedWordNewAudio(index, option.audio, null, option.content)
    }
  },
  revealWordChoiceAnswer() {
    const index = this.data.current
    const item = this.data.contents[index]
    const correctIndex = this.getWordChoiceCorrectIndex(item)
    const option = item.wordChoiceOptions && item.wordChoiceOptions[correctIndex]
    const updates = {
      ['contents[' + index + '].revealed']: true,
      ['contents[' + index + '].wordChoiceSelectedIndex']: correctIndex,
      ['contents[' + index + '].wordChoiceCorrect']: false
    }
    if (item.wordChoiceOrigin === 'known') {
      updates['contents[' + index + '].known'] = false
      updates['contents[' + index + '].mistaken'] = true
    }
    this.setData(updates)
    if (option && option.audio) {
      this.playResolvedWordNewAudio(index, option.audio, null, option.content)
    }
  },
  continueUnderstandWord() {
    const index = this.data.current
    this.enterWordDetail(index, 'choice')
  },
  markWordMistaken() {
    const index = this.data.current
    this.setData({
      ['contents[' + index + '].known']: false,
      ['contents[' + index + '].mistaken']: true
    })
    this.showWordHint(index, 'mistaken')
  },
  switchDetailTab(e) {
    const index = this.data.current
    const key = e.currentTarget.dataset.key
    if (!key) {
      return
    }
    this.setData({
      ['contents[' + index + '].word.activeDetailTab']: key
    })
  },
  goNextWord() {
    this.clearWordHintTimers()
    this.reportWordStep(this.data.current)
    if (this.data.current < this.data.contents.length - 1) {
      const next = this.data.current + 1
      const nextItem = this.data.contents[next]
      this.setData(Object.assign({
        current: next,
        playingSrc: ''
      }, this.getNavMeta(nextItem, next)))
      if (this.data.isWordNewMode) {
        wx.nextTick(() => this.startWordReading(next))
      } else {
        this.markWordStepStarted(next)
      }
      return
    }

    if (!this.wordId) {
      const scoreRate = computeWordNewScoreRate(this.data.contents)
      const url = appendReturnTabQuery(
        '../finish/today?unitId=' + this.unitId +
          '&unitSort=' + this.unitSort +
          '&taskType=word' +
          '&resBookId=' + encodeURIComponent(this.resBookId || '') +
          '&name=' + encodeURIComponent(this.resBookName || '') +
          '&scoreRate=' + scoreRate,
        this.returnTab
      )
      wx.navigateTo({ url })
    }
  },
  playTranslationAudio(e) {
    this.translationAudioIndex = e.currentTarget.dataset.index
    let translationAudio = e.currentTarget.dataset.src
    if (!this.data.innerAudioContext) {
        this.data.innerAudioContext = wx.createInnerAudioContext({
            useWebAudioImplement: false
        })
        this.data.innerAudioContext.onEnded(() => {
            console.log("onEnded")
            this.stopAudio()
        })
        this.data.innerAudioContext.onError(res => {
            console.log(res)
        })
    }
    this.selectComponent('.media').cancel()
    this.selectComponent('.audio-' + this.translationAudioIndex).setData({
        state: 'running'
    })
    this.data.innerAudioContext.src = translationAudio
    this.data.innerAudioContext.play()
  },
  stopAudio() {
    if (this.data.innerAudioContext) {
      let component = this.selectComponent('.audio-' + this.translationAudioIndex)
      if (component) {
          component.setData({
              state: 'paused'
          })
          this.data.innerAudioContext.stop()
      }
    }
  }
})
