const { getUserInfo, getUserBooks } = require('../../utils/api')
const { login } = require('../../utils/login')

function getSafeArea() {
  const systemInfo = wx.getSystemInfoSync()
  const safeArea = systemInfo.safeArea || {}
  const safeAreaTop = safeArea.top || systemInfo.statusBarHeight || 0
  const safeAreaBottom = safeArea.bottom
    ? Math.max(systemInfo.windowHeight - safeArea.bottom, 0)
    : 0
  return { safeAreaTop, safeAreaBottom }
}

function pickNumber() {
  for (let i = 0; i < arguments.length; i++) {
    const value = Number(arguments[i])
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }
  return 0
}

function sumLearnedWords(books) {
  if (!Array.isArray(books)) {
    return 0
  }
  return books.reduce((total, book) => {
    const info = (book.learningInfo && book.learningInfo.book) || {}
    return total + pickNumber(info.learningWords, info.wordCount, book.learningWords)
  }, 0)
}

Page({
  data: {
    safeAreaTop: 0,
    safeAreaBottom: 0,
    logined: false,
    userInfo: {},
    isVip: false,
    stats: {
      checkInDays: 0,
      learnedWords: 0,
      studyMinutes: 0
    },
    menus: [
      { id: 'book', icon: '📚', bg: '#e9f9ee', label: '我的教材', action: 'book' },
      { id: 'vip', icon: '👑', bg: '#fff3da', label: '会员中心', action: 'vip' },
      { id: 'remind', icon: '⏰', bg: '#e8f1ff', label: '学习提醒', action: 'remind' },
      { id: 'feedback', icon: '✏️', bg: '#f1ecff', label: '意见反馈', action: 'feedback' },
      { id: 'about', icon: 'ℹ️', bg: '#eef0f3', label: '关于我们', action: 'about' },
      { id: 'contact', icon: '🎧', bg: '#e9f9ee', label: '联系客服', openType: 'contact' }
    ]
  },

  onLoad() {
    this.setData(getSafeArea())
    this.loadProfile()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    if (this.refresh) {
      this.refresh = false
      this.loadProfile()
    }
  },

  loadProfile() {
    login().then(result => {
      if (!result || !result.logined) {
        this.setData({ logined: false })
        return
      }
      this.setData({ logined: true })
      this.loadUserInfo()
      this.loadStats()
    }).catch(error => {
      console.log('[me] load profile fallback', error)
    })
  },

  loadUserInfo() {
    getUserInfo().then(data => {
      if (!data) {
        return
      }
      const userInfo = {
        avatarUrl: data.avatarUrl || data.avatar || data.headImg || '',
        nickName: data.nickName || data.nickname || data.name || ''
      }
      this.setData({
        userInfo,
        isVip: !!(data.isVip || data.vip || data.vipForever)
      })
    }).catch(() => {})
  },

  loadStats() {
    getUserInfo().then(data => {
      data = data || {}
      this.setData({
        'stats.checkInDays': pickNumber(data.continuousDays, data.checkInDays, data.signDays),
        'stats.studyMinutes': pickNumber(data.studyMinutes, data.learnMinutes)
      })
    }).catch(() => {})

    getUserBooks().then(books => {
      this.setData({
        'stats.learnedWords': sumLearnedWords(books)
      })
    }).catch(() => {})
  },

  handleLogin() {
    if (this.data.logined) {
      return
    }
    login().then(result => {
      if (result && result.logined) {
        this.setData({ logined: true })
        this.loadUserInfo()
        this.loadStats()
      }
    })
  },

  goVip() {
    wx.navigateTo({ url: '../vip/vip' })
  },

  handleMenuTap(event) {
    const action = event.currentTarget.dataset.action
    if (!action) {
      return
    }
    if (action === 'vip') {
      this.goVip()
      return
    }
    if (action === 'book') {
      this.navToStudy()
      return
    }
    this.showPending()
  },

  onContact() {
    console.log('[me] open customer service')
  },

  navToStudy() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  showPending() {
    wx.showToast({
      title: '内容待补充',
      icon: 'none'
    })
  }
})
