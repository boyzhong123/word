const { getUserInfo } = require('../../utils/api')
const { imageUrl } = require('../../utils/image-host')
const { getMembership } = require('../../utils/membership')
const { readOrders } = require('../../utils/membership-orders')

function pickProfile(data) {
  data = data || {}
  return {
    avatar: data.avatarUrl || data.avatar || data.headImg || data.headImage || '',
    name: data.nickName || data.nickname || data.name || ''
  }
}

Page({
  data: {
    profileAvatar: '',
    profileName: '英语学习者',
    fallbackAvatar: '/images/app-logo.png',
    vipBadgeActiveImage: imageUrl('/images/home/vip-name-badge.png'),
    vipBadgeInactiveImage: imageUrl('/images/home/vip-name-badge-inactive.png'),
    emptyStateImage: imageUrl('/images/vip/membership-records-empty.png'),
    membership: getMembership(),
    orders: []
  },

  onLoad() {
    this.refresh()
    this.loadProfile()
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    this.setData({
      membership: getMembership(),
      orders: readOrders()
    })
  },

  loadProfile() {
    const app = getApp()
    const cached = pickProfile(
      (app && app.globalData && app.globalData.userInfo) ||
      wx.getStorageSync('userInfo')
    )
    this.setData({
      profileAvatar: cached.avatar,
      profileName: cached.name || '英语学习者'
    })
    getUserInfo().then(data => {
      const profile = pickProfile(data)
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

  copyOrder(event) {
    const orderId = event.currentTarget.dataset.id
    if (!orderId) {
      return
    }
    wx.setClipboardData({
      data: orderId,
      success() {
        wx.showToast({ title: '订单号已复制', icon: 'none' })
      }
    })
  }
})
