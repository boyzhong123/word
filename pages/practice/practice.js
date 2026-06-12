const {
    getWordInfo,
    getUnitResource
} = require('../../utils/api')
const {
    refreshHomePage
} = require('../../utils/util')
const {
    buildMockReviewResource
} = require('../../utils/review-mock')

const PRONUNCIATION_TIPS = [
  '先发 /æ/ 音，嘴巴张大，舌尖抵下齿背',
  '接着发 /p/ 音，双唇紧闭后突然张开送气',
  '最后发 /l/ 音，舌尖抵住上齿龈，气流从舌头两侧流出'
]

const DETAIL_TAB_DEFS = [
  { key: 'synonyms', label: '近义词' },
  { key: 'mnemonic', label: '联想记忆' },
  { key: 'root', label: '词根' },
  { key: 'recite', label: '背诵技巧' }
]

const WORD_HINT_VISIBLE_MS = 2000
// 跟读模式：当前词全部条目读完评分后，倒计时自动进入下一词（与小测一致）
const AUTO_NEXT_COUNTDOWN_S = 3
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

Page({
  data: {
    loading: true,
    from: '',
    taskType: 'recitation',
    isWordNewMode: false,
    review: false,
    pronunciationTips: PRONUNCIATION_TIPS,
    navTitle: '',
    playingSrc: '',
    marking: false,
    scrollHeight: wx.getStorageSync('safeArea').height - wx.getStorageSync('navigationBarHeight'),
    safeAreaBottom: wx.getStorageSync('windowHeight') - wx.getStorageSync('safeArea').bottom,
    dialog: { type: '' },
    axis: {
      'anchor-page': { text: '在书中对应的页数 x', top: 0, left: 0, hidden: 'hidden', class: 'anchor-page', marginleft: 1 },
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
        const wordTotal = 1
        this.setData({
          loading: false,
          from: 'search',
          needVip: data.needVip,
          wordTotal: wordTotal,
          dialog: dialogObject,
          contents: contents,
          navTitle: this.data.isWordNewMode ? this.buildNavTitle(data, 0, wordTotal) : ''
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
      // 错词复习模式：review=1，reviewUnitIds 为覆盖的关卡 id 列表。
      // 待后端提供错词接口后，可据此把内容收敛到这些关卡里做错的词。
      this.review = options.review === '1' || options.review === 1
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
    const wordTotal = data.length
    this.setData({
      loading: false,
      current: 0,
      needVip: 0,
      wordTotal: wordTotal,
      dialog: this.getDialogObject(false),
      contents: data,
      navTitle: this.data.isWordNewMode ? this.buildNavTitle(data[0], 0, wordTotal) : ''
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
    getUnitResource(unitId).then(data => {
      let vip = false
      if (Array.isArray(data)) {
          data.forEach(item => {
              this.initResult(item)
          })
          vip = !data.some(item => item.needVip)
      }
      const wordTotal = data.length
      this.setData({
        loading: false,
        current: 0,
        needVip: vip ? 0 : 1,
        wordTotal: wordTotal,
        dialog: this.getDialogObject(!vip),
        contents: data,
        navTitle: this.data.isWordNewMode ? this.buildNavTitle(data[0], 0, wordTotal) : ''
      })
      this.last = 0
      this.dx = 0
      if (this.data.isWordNewMode) {
        wx.nextTick(() => this.startWordReading(0))
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
              wx.navigateTo({
                  url: '../vip/vip?resBookId=' + that.resBookId + '&name=' + that.resBookName,
                  events: {
                      'vip': () => {
                          refreshHomePage()
                          that.setData({
                              needVip: 0
                          })
                      }
                  }
              })
          }
      }
  },
  initResult(item) {
    item.selectedIndex = 0
    item.revealed = false
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
      item.proverb.forEach(function (item) {
        item.result = {}
      })
    }
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
  goRoute() {
    wx.navigateTo({
      url: '../catalogue/catalogue?resBookId=' + this.resBookId + '&unitId=' + this.unitId + '&name=' + this.resBookName,
      events: {
        'study': p => {
          this.resBookId = p.resBookId
          this.unitId = p.unitId
          this.studyNew = true
        }
      }
    })
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
    const index = this.data.current
    if (!this.isRecitationItemDone(this.data.contents[index])) {
      return
    }
    this.startAutoNextCountdown(index)
  },

  startAutoNextCountdown(index) {
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

    tick()
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
    this.setData({ autoNextCountdown: 0 })
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
  onMediaStateChange(e) {
    if (e.detail.state != 0) {
        this.stopAudio()
        // 播放/录音/评分中暂停自动切题；回到空闲后若本词已读完会重新计时
        this.stopAutoNextCountdown()
    } else {
        this.scheduleAutoNextIfDone()
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
    if (!wx.getStorageSync('anchor-page')) {
      query.selectAll('.anchor-page').boundingClientRect()
    }
    query.exec(res => {
      this.scrollviewTop = res[0].top
      this.scrollTop = 0
      if (res.length > 1 && res[1][1].width > 3) {
        wx.setStorageSync('anchor-page', true)
        this.setData({
          'axis.anchor-page.top': res[1][1].top - res[1][0].height,
          'axis.anchor-page.left': res[1][1].left + 5,
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
    this.hideTip()
    this.stopAutoNextCountdown()
    this.setData({
      current: e.detail.current
    })
  },
  touchMove(e) {
    this.dx = e.detail.dx
  },
  animationfinish() {
    this.last = this.data.current
    this.dx = 0
  },
  touchEnd(e) {
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
    this.setData({
      current: next
    })
    this.last = next
    this.dx = 0
  },
  goFinishPage() {
    wx.navigateTo({
      url: '../finish/today?unitId=' + this.unitId + "&unitSort=" + this.unitSort,
      events: {
        'continue': p => {
          this.resBookId = p.resBookId
          this.unitId = p.unitId
          this.studyNew = true
        }
      }
    })
  },
  buildNavTitle(item, index, total) {
    const wordTotal = total || this.data.wordTotal || this.data.contents.length || 0
    const sort = (item && item.unit && item.unit.sort) || this.unitSort || (index + 1)
    return '第' + sort + '期 ' + (index + 1) + '/' + wordTotal
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
  playWordNewAudio(src, onEnded) {
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
    this.setData({ playingSrc: src })
    this.wordNewAudio.src = src
    this.wordNewAudio.play()
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
    this.playWordNewAudio(this.getActiveAccentAudio(index))
  },
  playDetailIntro(index) {
    this.setWordReadCount(index, 2)
    this.playWordNewAudio(this.getActiveAccentAudio(index), () => {
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
    this.playWordNewAudio(e.currentTarget.dataset.src)
  },
  switchWordAccent(e) {
    const index = this.data.current
    const key = e.currentTarget.dataset.key
    const src = e.currentTarget.dataset.src
    this.setData({
      ['contents[' + index + '].word.activeAccent']: key
    })
    if (src) {
      this.playWordNewAudio(src)
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
      ['contents[' + index + '].known']: known
    })
    this.playDetailIntro(index)
  },
  answerKnow() {
    const index = this.data.current
    this.showWordHint(index, 'known', () => this.revealWord(index, true))
  },
  answerUnknown() {
    const index = this.data.current
    this.showWordHint(index, 'unknown', () => this.revealWord(index, false))
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
    if (this.data.current < this.data.contents.length - 1) {
      const next = this.data.current + 1
      const nextItem = this.data.contents[next]
      this.setData({
        current: next,
        navTitle: this.buildNavTitle(nextItem, next, this.getPracticeWordTotal())
      })
      if (this.data.isWordNewMode) {
        wx.nextTick(() => this.startWordReading(next))
      }
      return
    }

    if (!this.wordId) {
      wx.navigateTo({
        url: '../finish/today?unitId=' + this.unitId + "&unitSort=" + this.unitSort,
        events: {
          'continue': p => {
            this.resBookId = p.resBookId
            this.unitId = p.unitId
            this.studyNew = true
          }
        }
      })
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
