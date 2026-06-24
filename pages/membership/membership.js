// pages/membership/membership.js
// 会员购买页：套餐选择、兑换码绑定、确认开通与本地购买记录。
const {
  DEFAULT_TIER_ID,
  getTier,
  getMembership,
  activateMembership
} = require('../../utils/membership')
const { imageUrl } = require('../../utils/image-host')
const { getUserInfo } = require('../../utils/api')
const {
  readOrders,
  createOrder,
  saveOrder
} = require('../../utils/membership-orders')

const REDEEM_CODE_TIERS = {
  '2818M32': 'm1',
  '2818M21': 'm2'
}
const DISPLAY_TIERS = ['y1', 'm2', 'm1'].map(getTier).filter(Boolean)
const LEARNING_STEPS = [
  {
    id: 'word',
    image: '/images/vip/step-word.jpg',
    title: '单词新学',
    desc: '识记词义与例句'
  },
  {
    id: 'recite',
    image: '/images/vip/step-recite.jpg',
    title: '跟读背诵',
    desc: '开口练习与评分'
  },
  {
    id: 'listen',
    image: '/images/vip/step-listen.jpg',
    title: '随身听',
    desc: '课文单词反复听'
  },
  {
    id: 'report',
    image: '/images/vip/step-report.jpg',
    title: '报告复习',
    desc: '掌握情况及时复盘'
  }
]

const PATH_STEPS = [
  {
    id: 'word',
    image: '/images/vip/path-word.jpg',
    title: '先学会',
    desc: '完成单词识记、释义选择和例句理解'
  },
  {
    id: 'recite',
    image: '/images/vip/path-recite.jpg',
    title: '再开口',
    desc: '跟读句子并通过语音评分纠正发音'
  },
  {
    id: 'listen',
    image: '/images/vip/path-listen.jpg',
    title: '随时听',
    desc: '利用碎片时间复听课文和单词句子'
  },
  {
    id: 'report',
    image: '/images/vip/path-report.jpg',
    title: '看报告',
    desc: '根据掌握度和待复习内容继续巩固'
  }
]

const BENEFITS = [
  { icon: '/images/vip/icon-textbooks.png', title: '100+ 本同步教材', desc: '覆盖小学至高中主流版本与新教材' },
  { icon: imageUrl('/images/home/icon-benefit-unlock.svg'), title: '全部关卡解锁', desc: '第 2 关起的教材内容全部开放' },
  { icon: imageUrl('/images/home/icon-benefit-listen.svg'), title: '随身听全开', desc: '课文、单词句子和听力小测随时学' },
  { icon: imageUrl('/images/home/icon-benefit-speaking.svg'), title: '跟读评分纠音', desc: '逐句练习并查看语音评测反馈' },
  { icon: imageUrl('/images/home/icon-benefit-report.svg'), title: '学习报告与复习', desc: '掌握度、待复习词和环节表现一目了然' }
]

const COMPARE_ROWS = [
  { label: '同步教材数量', free: '当前教材试学', vip: '100+ 本' },
  { label: '教材第 1 关', free: '完整体验', vip: '完整体验' },
  { label: '后续教材关卡', free: '未开放', vip: '全部解锁' },
  { label: '随身听', free: '仅第 1 关', vip: '全部开放' },
  { label: '跟读评分纠音', free: '仅第 1 关', vip: '全部开放' },
  { label: '报告与复习', free: '仅第 1 关', vip: '全部开放' }
]

function normalizeCode(value) {
  return String(value == null ? '' : value).trim().toUpperCase()
}

function pickProfile(data) {
  data = data || {}
  return {
    avatar: data.avatarUrl || data.avatar || data.headImg || data.headImage || '',
    name: data.nickName || data.nickname || data.name || ''
  }
}

function getCachedProfile() {
  const app = typeof getApp === 'function' ? getApp() : null
  const globalInfo = app && app.globalData ? app.globalData.userInfo : null
  return pickProfile(globalInfo || wx.getStorageSync('userInfo'))
}

Page({
  data: {
    safeAreaBottom: 0,
    profileAvatar: '',
    profileName: '英语学习者',
    fallbackAvatar: '/images/app-logo.png',
    membershipHeroImage: imageUrl('/images/vip/membership-family-hero-v2.jpg'),
    vipBadgeActiveImage: imageUrl('/images/home/vip-name-badge.png'),
    vipBadgeInactiveImage: imageUrl('/images/home/vip-name-badge-inactive.png'),
    learningSteps: LEARNING_STEPS,
    pathSteps: PATH_STEPS,
    benefits: BENEFITS,
    compareRows: COMPARE_ROWS,
    tiers: DISPLAY_TIERS,
    selectedTierId: DEFAULT_TIER_ID,
    currentTier: getTier(DEFAULT_TIER_ID),
    membership: getMembership(),
    orders: [],
    showConfirm: false,
    redeemInput: '',
    redeemFocus: false,
    redeemApplied: false,
    appliedCode: '',
    redeemTierId: '',
    redeemError: '',
    agreementChecked: true,
    agreementAttention: false,
    paid: false
  },

  onLoad(options) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const safeAreaBottom = info.safeArea
      ? Math.max(info.windowHeight - info.safeArea.bottom, 0)
      : 0
    const tierId = options && getTier(options.tierId) ? options.tierId : DEFAULT_TIER_ID
    const showConfirm = !!(options && (options.openSku === '1' || options.openSku === true))
    const cachedProfile = getCachedProfile()
    this.setData({
      safeAreaBottom,
      profileAvatar: cachedProfile.avatar,
      profileName: cachedProfile.name || '英语学习者',
      selectedTierId: tierId,
      currentTier: getTier(tierId),
      membership: getMembership(),
      orders: readOrders(),
      showConfirm
    })
    this.loadProfile()
  },

  onShow() {
    if (!this.data.paid) {
      this.setData({
        membership: getMembership(),
        orders: readOrders()
      })
    }
  },

  loadProfile() {
    getUserInfo().then(data => {
      const profile = pickProfile(data)
      if (!profile.avatar && !profile.name) {
        return
      }
      this.setData({
        profileAvatar: profile.avatar || this.data.profileAvatar,
        profileName: profile.name || this.data.profileName
      })
    }).catch(() => {})
  },

  onAvatarError() {
    if (this.data.profileAvatar) {
      this.setData({ profileAvatar: '' })
    }
  },

  selectTier(event) {
    if (this.data.redeemApplied) {
      wx.showToast({ title: '请先删除已应用的兑换码', icon: 'none' })
      return
    }
    const tier = getTier(event.currentTarget.dataset.id)
    if (!tier) {
      return
    }
    this.setData({
      selectedTierId: tier.id,
      currentTier: tier
    })
  },

  openConfirm(event) {
    if (this.data.paid) {
      return
    }
    const mode = event && event.currentTarget && event.currentTarget.dataset
      ? event.currentTarget.dataset.mode
      : ''
    this.setData({
      showConfirm: true,
      redeemFocus: mode === 'redeem' && !this.data.redeemApplied,
      redeemError: ''
    })
  },

  closeConfirm() {
    this.setData({
      showConfirm: false,
      redeemFocus: false,
      redeemError: ''
    })
  },

  preventClose() {},

  onRedeemInput(event) {
    this.setData({
      redeemInput: event.detail.value,
      redeemError: ''
    })
  },

  applyRedeem() {
    if (this.data.paid || this.data.redeemApplied) {
      return
    }
    const code = normalizeCode(this.data.redeemInput)
    if (!code) {
      this.setData({ redeemError: '请输入兑换码' })
      return
    }
    const tierId = REDEEM_CODE_TIERS[code]
    const tier = tierId ? getTier(tierId) : null
    if (!tier) {
      this.setData({ redeemError: '兑换码无效或已使用' })
      return
    }
    this.setData({
      selectedTierId: tier.id,
      currentTier: tier,
      redeemInput: code,
      redeemApplied: true,
      appliedCode: code,
      redeemTierId: tier.id,
      redeemError: '',
      redeemFocus: false
    })
    wx.showToast({ title: '已匹配' + tier.name + '会员', icon: 'none' })
  },

  removeRedeem() {
    if (this.data.paid) {
      return
    }
    this.setData({
      redeemInput: '',
      redeemApplied: false,
      appliedCode: '',
      redeemTierId: '',
      redeemError: '',
      redeemFocus: true
    })
  },

  toggleAgreement() {
    this.setData({
      agreementChecked: !this.data.agreementChecked,
      agreementAttention: false
    })
  },

  openPaidAgreement() {
    wx.navigateTo({
      url: '/pages/me/paid-agreement'
    })
  },

  openRecords() {
    wx.navigateTo({ url: '/pages/membership-records/membership-records' })
  },

  confirmMembership() {
    if (this.paying || this.data.paid) {
      return
    }
    if (!this.data.agreementChecked) {
      this.setData({ agreementAttention: true })
      wx.showToast({ title: '请先阅读并同意用户付费协议', icon: 'none' })
      return
    }

    const tier = this.data.currentTier || getTier(DEFAULT_TIER_ID)
    const renewing = this.data.membership.active
    this.paying = true

    if (this.data.redeemApplied) {
      wx.showLoading({ title: '正在兑换', mask: true })
      setTimeout(() => {
        wx.hideLoading()
        this.paying = false
        this.onSuccess(tier, true, renewing)
      }, 450)
      return
    }

    this.setData({ showConfirm: false })
    wx.showModal({
      title: '模拟微信支付',
      content: '支付 ¥' + tier.price +
        (renewing ? ' 延长「' : ' 开通「') +
        tier.name + '会员」。测试环境不会真实扣款。',
      confirmText: '支付成功',
      cancelText: '取消支付',
      success: (res) => {
        this.paying = false
        if (res.confirm) {
          this.onSuccess(tier, false, renewing)
        }
      },
      fail: () => {
        this.paying = false
      }
    })
  },

  onSuccess(tier, byRedeem, renewing) {
    const membership = activateMembership(tier.id)
    const order = createOrder(tier, byRedeem, this.data.appliedCode, membership)
    const orders = saveOrder(order)
    this.setData({
      paid: true,
      showConfirm: false,
      membership,
      orders
    })
    wx.showToast({
      title: renewing ? '续费成功' : (byRedeem ? '兑换成功' : '开通成功'),
      icon: 'success'
    })

    setTimeout(() => {
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.membershipUpdatedAt = Date.now()
      }
      const channel = typeof this.getOpenerEventChannel === 'function'
        ? this.getOpenerEventChannel()
        : null
      if (channel && typeof channel.emit === 'function') {
        channel.emit('membership', membership)
      }
      wx.redirectTo({
        url: '/pages/membership-success/membership-success?orderId=' + encodeURIComponent(order.id)
      })
    }, 550)
  }
})
