// pages/advertisement/advertisement.js
const {
    refreshHomePage
} = require('../../utils/util')

const systemInfo = wx.getSystemInfoSync()
const safeArea = wx.getStorageSync('safeArea') || systemInfo.safeArea || {
  bottom: systemInfo.windowHeight
}
const safeAreaBottom = systemInfo.windowHeight - safeArea.bottom
const statusBarHeight = wx.getStorageSync('statusBarHeight') || 0
const navigationBarHeight = wx.getStorageSync('navigationBarHeight') || 0
const purchaseBarHeight = Math.round(62 + safeAreaBottom)
const scrollHeight = systemInfo.windowHeight - statusBarHeight - navigationBarHeight - purchaseBarHeight
const encodeQueryValue = (value) => encodeURIComponent(value == null ? '' : value)

function decodeQueryValue(value) {
  if (value == null || value === '') {
    return ''
  }
  try {
    return decodeURIComponent(String(value))
  } catch (error) {
    return String(value)
  }
}

function applyBookDetail(page, book, unlocked) {
  const learningUnits = book.learningInfo && book.learningInfo.book
    ? book.learningInfo.book.learningUnits
    : 0

  page.resBookId = book.resBookId || ''
  page.setData({
    name: book.name || '',
    bookCover: book.bookCover || '',
    total: Number(book.total || learningUnits || 0),
    wordCount: Number(book.wordCount || 0),
    proverbCount: Number(book.proverbCount || 0),
    press: book.press || '',
    intro: book.intro || '',
    unlocked: !!unlocked
  })
}

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
    unlocked: false,
    scrollHeight,
    safeAreaBottom,
    actionHeight: purchaseBarHeight
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const app = getApp()
    const pendingBook = app.globalData.pendingBookDetail
    const resBookId = decodeQueryValue(options.resBookId)
    const unlocked = options.unlocked === '1'

    if (pendingBook && pendingBook.resBookId === resBookId) {
      applyBookDetail(this, pendingBook, unlocked)
      app.globalData.pendingBookDetail = null
      return
    }

    applyBookDetail(this, {
      resBookId,
      name: decodeQueryValue(options.name),
      bookCover: decodeQueryValue(options.bookCover),
      total: options.total,
      wordCount: options.wordCount,
      proverbCount: options.proverbCount,
      press: decodeQueryValue(options.press),
      intro: decodeQueryValue(options.intro)
    }, unlocked)
  },
  goVip() {
    wx.navigateTo({
      url: '../vip/vip?resBookId=' + encodeURIComponent(this.resBookId || '') + '&name=' + encodeURIComponent(this.data.name || ''),
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
      resBookId: this.resBookId,
      unlocked: this.data.unlocked ? '1' : '0'
    }

    return {
      path: '/pages/advertisement/advertisement?' + Object.keys(query)
        .map((key) => key + '=' + encodeQueryValue(query[key]))
        .join('&')
    }
  }
})
