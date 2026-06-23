// pages/membership/membership.js
// 会员开通页：按时长购买（单一会员，解锁全部关卡与随身听）。
// 现阶段支付为本地模拟，开通后写入本地会员状态。
const {
  MEMBERSHIP_TIERS,
  DEFAULT_TIER_ID,
  getTier,
  getMembership,
  activateMembership
} = require('../../utils/membership')
const { imageUrl } = require('../../utils/image-host')

const REDEEM_CODES = ['2818M32', '2818M21']

const BENEFITS = [
  { icon: imageUrl('/images/home/icon-benefit-unlock.svg'), title: '全部关卡解锁', desc: '免费版仅开放第 1 关' },
  { icon: imageUrl('/images/home/icon-benefit-listen.svg'), title: '随身听全开', desc: '所有关卡音频随时磨耳朵' },
  { icon: imageUrl('/images/home/icon-benefit-report.svg'), title: '学习报告与复习', desc: '记忆曲线安排科学复习' },
  { icon: imageUrl('/images/home/icon-benefit-speaking.svg'), title: '跟读评分纠音', desc: '逐音反馈，发音更标准' }
]

function normalizeCode(value) {
  return String(value == null ? '' : value).trim().toUpperCase()
}

function getStatusBarHeight() {
  const h = wx.getStorageSync('statusBarHeight')
  return Number(h) || 20
}

Page({
  data: {
    statusBarHeight: getStatusBarHeight(),
    safeAreaBottom: 0,
    benefits: BENEFITS,
    tiers: MEMBERSHIP_TIERS,
    selectedTierId: DEFAULT_TIER_ID,
    currentTier: getTier(DEFAULT_TIER_ID),
    membership: getMembership(),
    redeemInput: '',
    redeemApplied: false,
    paid: false
  },

  onLoad(options) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const safeAreaBottom = info.safeArea
      ? Math.max(info.windowHeight - info.safeArea.bottom, 0)
      : 0
    const tierId = options && getTier(options.tierId) ? options.tierId : DEFAULT_TIER_ID
    this.setData({
      safeAreaBottom,
      selectedTierId: tierId,
      currentTier: getTier(tierId),
      membership: getMembership()
    })
  },

  back() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/today/today' })
    }
  },

  selectTier(event) {
    const tierId = event.currentTarget.dataset.id
    const tier = getTier(tierId)
    if (!tier) {
      return
    }
    this.setData({ selectedTierId: tierId, currentTier: tier })
  },

  onRedeemInput(event) {
    this.setData({ redeemInput: event.detail.value })
  },

  applyRedeem() {
    const code = normalizeCode(this.data.redeemInput)
    if (!code) {
      wx.showToast({ title: '请输入兑换码', icon: 'none' })
      return
    }
    if (REDEEM_CODES.indexOf(code) === -1) {
      wx.showToast({ title: '兑换码无效', icon: 'none' })
      return
    }
    this.setData({ redeemApplied: true })
    wx.showToast({ title: '兑换码可用，确认开通即可', icon: 'none' })
  },

  openMembership() {
    if (this.paying || this.data.paid) {
      return
    }
    this.paying = true
    const tier = this.data.currentTier || getTier(DEFAULT_TIER_ID)

    if (this.data.redeemApplied) {
      wx.showLoading({ title: '正在兑换', mask: true })
      setTimeout(() => {
        wx.hideLoading()
        this.paying = false
        this.onSuccess(tier, true)
      }, 400)
      return
    }

    wx.showLoading({ title: '正在拉起支付', mask: true })
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '模拟微信支付',
        content: '支付 ¥' + tier.price + ' 开通「' + tier.name + '会员」。测试环境不会真实扣款。',
        confirmText: '支付成功',
        cancelText: '取消支付',
        success: (res) => {
          this.paying = false
          if (res.confirm) {
            this.onSuccess(tier, false)
          }
        },
        fail: () => {
          this.paying = false
        }
      })
    }, 400)
  },

  onSuccess(tier, byRedeem) {
    const membership = activateMembership(tier.id)
    this.setData({ paid: true, membership })
    wx.showToast({ title: byRedeem ? '兑换成功' : '开通成功', icon: 'success' })

    setTimeout(() => {
      const channel = typeof this.getOpenerEventChannel === 'function'
        ? this.getOpenerEventChannel()
        : null
      if (channel && typeof channel.emit === 'function') {
        channel.emit('membership', membership)
      }
      this.back()
    }, 900)
  },

  noop() {}
})
