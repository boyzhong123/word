// pages/vip/vip.js 确认订单页：测试环境使用模拟支付完成购买闭环
const { markDevPurchased } = require('../../utils/dev-books')
const { requestSubscribeForEvent } = require('../../utils/subscribe')

const systemInfo = wx.getSystemInfoSync()
const safeArea = wx.getStorageSync('safeArea') || systemInfo.safeArea || {
  bottom: systemInfo.windowHeight
}
const safeAreaBottom = systemInfo.windowHeight - safeArea.bottom

// 有效兑换码（固定配置，测试环境用；之后可换成后端校验）。大小写不敏感
const REDEEM_CODES = ['2818M32', '2818M21']

function normalizeCode(value) {
  return String(value == null ? '' : value).trim().toUpperCase()
}

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
    validityId: 'forever',
    validityName: '永久有效',
    price: 0,
    payPrice: 0,
    redeemInput: '',
    redeemApplied: false,
    appliedCode: '',
    redeemError: '',
    paid: false,
    safeAreaBottom
  },

  onLoad(options) {
    const price = Number(options.price) || 0
    this.setData({
      resBookId: decodeQueryValue(options.resBookId),
      name: decodeQueryValue(options.name),
      bookCover: decodeQueryValue(options.bookCover),
      press: decodeQueryValue(options.press),
      packageId: decodeQueryValue(options.packageId) || 'full',
      packageName: decodeQueryValue(options.packageName) || '词典+智能学习卡',
      validityId: decodeQueryValue(options.validityId) || 'forever',
      validityName: decodeQueryValue(options.validityName) || '永久有效',
      price,
      payPrice: price
    })
  },

  onRedeemInput(event) {
    this.setData({ redeemInput: event.detail.value, redeemError: '' })
  },

  applyRedeem() {
    if (this.data.paid) {
      return
    }
    const code = normalizeCode(this.data.redeemInput)
    if (!code) {
      this.setData({ redeemError: '请输入兑换码' })
      return
    }
    if (REDEEM_CODES.indexOf(code) === -1) {
      this.setData({ redeemError: '兑换码无效或已使用' })
      return
    }
    this.setData({
      redeemApplied: true,
      appliedCode: code,
      redeemError: '',
      payPrice: 0
    })
    wx.showToast({ title: '已抵扣 ¥' + this.data.price, icon: 'none' })
  },

  removeRedeem() {
    if (this.data.paid) {
      return
    }
    this.setData({
      redeemApplied: false,
      appliedCode: '',
      redeemInput: '',
      redeemError: '',
      payPrice: this.data.price
    })
  },

  pay() {
    if (this.paying || this.data.paid) {
      return
    }
    this.paying = true

    // 兑换码已抵扣成 0 元：跳过支付，直接兑换解锁
    if (this.data.payPrice <= 0) {
      wx.showLoading({ title: '正在兑换', mask: true })
      setTimeout(() => {
        wx.hideLoading()
        this.paying = false
        this.onPaySuccess()
      }, 400)
      return
    }

    wx.showLoading({ title: '正在拉起支付', mask: true })
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '模拟微信支付',
        content: '支付 ¥' + this.data.payPrice + ' 购买「' + this.data.packageName + '」。测试环境不会真实扣款。',
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
    requestSubscribeForEvent('subscribePref_payment')
    this.setData({ paid: true })
    wx.showToast({ title: this.data.redeemApplied ? '兑换成功' : '购买成功', icon: 'success' })

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
