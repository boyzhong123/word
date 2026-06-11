// pages/vip/vip.js 确认订单页：测试环境使用模拟支付完成购买闭环
const { markDevPurchased } = require('../../utils/dev-books')

const systemInfo = wx.getSystemInfoSync()
const safeArea = wx.getStorageSync('safeArea') || systemInfo.safeArea || {
  bottom: systemInfo.windowHeight
}
const safeAreaBottom = systemInfo.windowHeight - safeArea.bottom

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

Page({
  data: {
    resBookId: '',
    name: '',
    bookCover: '',
    press: '',
    packageId: 'full',
    packageName: '',
    price: 0,
    paid: false,
    safeAreaBottom
  },

  onLoad(options) {
    this.setData({
      resBookId: decodeQueryValue(options.resBookId),
      name: decodeQueryValue(options.name),
      bookCover: decodeQueryValue(options.bookCover),
      press: decodeQueryValue(options.press),
      packageId: decodeQueryValue(options.packageId) || 'full',
      packageName: decodeQueryValue(options.packageName) || '学习卡套餐',
      price: Number(options.price) || 0
    })
  },

  pay() {
    if (this.paying || this.data.paid) {
      return
    }
    this.paying = true

    wx.showLoading({ title: '正在拉起支付', mask: true })
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '模拟微信支付',
        content: '支付 ¥' + this.data.price + ' 购买「' + this.data.packageName + '」。测试环境不会真实扣款。',
        confirmText: '支付成功',
        cancelText: '取消支付',
        success: (res) => {
          this.paying = false
          if (!res.confirm) {
            return
          }
          this.onPaySuccess()
        },
        fail: () => {
          this.paying = false
        }
      })
    }, 400)
  },

  onPaySuccess() {
    markDevPurchased(this.data.resBookId)
    this.setData({ paid: true })
    wx.showToast({ title: '购买成功', icon: 'success' })

    setTimeout(() => {
      const channel = typeof this.getOpenerEventChannel === 'function'
        ? this.getOpenerEventChannel()
        : null
      if (channel && typeof channel.emit === 'function') {
        channel.emit('vip')
      } else {
        wx.navigateBack()
      }
    }, 900)
  }
})
