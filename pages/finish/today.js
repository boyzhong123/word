// pages/finish/today.js
const { saveRecord } = require('../../utils/api')
const { recordLevelDone } = require('../../utils/checkin-progress')
Page({
  data: {
    unitSort: 1,
    unitCount: 0,
    wordnum: 0,
    proverbnum: 0,
    bookname: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.book = getApp().globalData.book
    this.setData({
      unitSort: options.unitSort,
      unitCount: this.book.unitCount,
      wordnum: this.book.wordCount,
      proverbnum: this.book.proverbCount,
      bookname: this.book.name
    })
    // 完成一个关卡即记录今日打卡进度（按 unitId 去重、跨天自动重置）
    recordLevelDone(this.book.resBookId, options.unitId)
    saveRecord(options.unitId).then(data => {
      this.nextUnitId = data.nextUnitId
    })
    var pages = getCurrentPages() //获取加载的页面
    for (let i = 0; i < pages.length; i++) {
      pages[i].route == 'pages/home/home'
      pages[i].refresh = true
      break
    }
  },
  continue() {
    this.getOpenerEventChannel().emit('continue', { resBookId: this.book.resBookId, unitId: this.nextUnitId })
    wx.navigateBack()
  },
  finish() {
    wx.navigateBack({
      delta: getCurrentPages().length - 1
    })
  }
})