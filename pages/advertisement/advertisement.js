// pages/advertisement/advertisement.js
const {
    refreshHomePage
} = require('../../utils/util')

const systemInfo = wx.getSystemInfoSync()
const safeArea = wx.getStorageSync('safeArea') || systemInfo.safeArea || {
  bottom: systemInfo.windowHeight
}
const safeAreaBottom = systemInfo.windowHeight - safeArea.bottom
const encodeQueryValue = (value) => encodeURIComponent(value == null ? '' : value)

Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    bookCover: "",
    total: 0,
    wordCount: 0,
    proverbCount: 0,
    press: "",
    intro: "",
    scrollHeight: systemInfo.windowHeight - wx.getStorageSync('navigationBarHeight') - wx.getStorageSync('statusBarHeight'),
    safeAreaBottom,
    actionHeight: 78 + safeAreaBottom
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.resBookId = options.resBookId
    this.setData({
      name: options.name || '',
      bookCover: options.bookCover || '',
      total: options.total || 0,
      wordCount: options.wordCount || 0,
      proverbCount: options.proverbCount || 0,
      press: options.press || '',
      intro: options.intro || ''
    })
  },
  goVip() {
    wx.navigateTo({
      url: '../vip/vip?resBookId=' + this.resBookId + '&name=' + this.data.name,
      events: {
        'vip': () => {
            refreshHomePage()
            wx.navigateBack()
        }
      }
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const query = {
      name: this.data.name,
      bookCover: this.data.bookCover,
      total: this.data.total,
      wordCount: this.data.wordCount,
      proverbCount: this.data.proverbCount,
      press: this.data.press,
      intro: this.data.intro,
      resBookId: this.resBookId
    }

    return {
      path: '/pages/advertisement/advertisement?' + Object.keys(query)
        .map((key) => key + '=' + encodeQueryValue(query[key]))
        .join('&')
    }
  }
})
