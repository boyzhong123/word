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

const WORD_DETAIL_TABS = [
  { key: 'example', label: '例句' },
  { key: 'phrase', label: '短语' },
  { key: 'forms', label: '变形' }
]

Page({
  data: {
    loading: true,
    from: '',
    taskType: 'recitation',
    isWordNewMode: false,
    review: false,
    pronunciationTips: PRONUNCIATION_TIPS,
    wordDetailTabs: WORD_DETAIL_TABS,
    wordDetailTab: 'example',
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

    if (options && options.id) {
      this.wordId = options.id
      getWordInfo(this.wordId).then(data => {
        this.initResult(data)
        this.resBookId = data.book.resBookId
        this.resBookName = data.book.name
        let dialogObject = this.getDialogObject(data.needVip)
        this.setData({
          loading: false,
          from: 'search',
          needVip: data.needVip,
          wordTotal: data.unit.wordTotal,
          dialog: dialogObject,
          ['contents[' + 0 + ']']: data
        })
        this.showPageTip()
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
    this.setData({
      loading: false,
      current: 0,
      needVip: 0,
      wordTotal: data.length,
      dialog: this.getDialogObject(false),
      contents: data
    })
    this.showPageTip()
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
      this.setData({
        loading: false,
        current: 0,
        needVip: vip ? 0 : 1,
        wordTotal: data.length,
        dialog: this.getDialogObject(!vip),
        contents: data
      })
      this.showPageTip()
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
    this.unitSort = item.unit.sort
    if (item.word) {
      item.word.page = item.word.pages.join('-')
      item.word.result = {}
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
      this.stopAudio()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
      if (this.data.innerAudioContext) {
        this.data.innerAudioContext.offEnded()
        this.data.innerAudioContext.offError()
        this.data.innerAudioContext.destroy()
      }
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
  },
  back() {
    this.setData({
      dialog: {
        type: 'general', title: '提示', content: '确认退出当前学习？', cancelText: '取消', confirmText: '确认', confirm: function () {
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
  goNextWord() {
    if (this.data.current < this.data.contents.length - 1) {
      this.setData({
        current: this.data.current + 1
      })
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
  switchWordDetailTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab && tab !== this.data.wordDetailTab) {
      this.setData({
        wordDetailTab: tab
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
