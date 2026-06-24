const { getMembership } = require('../../utils/membership')
const { getOrder, readOrders } = require('../../utils/membership-orders')
const { imageUrl } = require('../../utils/image-host')

Page({
  data: {
    safeAreaBottom: 0,
    successImage: imageUrl('/images/vip/membership-success.jpg'),
    order: null,
    membership: getMembership(),
    unlocks: [
      { image: '/images/vip/step-word.jpg', label: '100+ 本教材' },
      { image: '/images/vip/step-recite.jpg', label: '跟读评分' },
      { image: '/images/vip/step-listen.jpg', label: '随身听全开' },
      { image: '/images/vip/step-report.jpg', label: '报告与复习' }
    ]
  },

  onLoad(options) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const safeAreaBottom = info.safeArea
      ? Math.max(info.windowHeight - info.safeArea.bottom, 0)
      : 0
    const orderId = options && options.orderId ? decodeURIComponent(options.orderId) : ''
    const order = getOrder(orderId) || readOrders()[0] || null
    this.setData({
      safeAreaBottom,
      order,
      membership: getMembership()
    })
  },

  returnToday() {
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.membershipUpdatedAt = Date.now()
    }
    wx.switchTab({ url: '/pages/today/today' })
  },

  openRecords() {
    wx.navigateTo({ url: '/pages/membership-records/membership-records' })
  }
})
