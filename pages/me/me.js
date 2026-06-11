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
    stats: {
      checkInDays: 0,
      learnedWords: 0,
      studyMinutes: 0
    },
    menus: [
      {
        id: 'book',
        label: '我的教材',
        desc: '查看当前学习内容',
        action: 'book'
      },
      {
        id: 'notify',
        label: '消息授权状态',
        desc: '管理订阅消息、公众号提醒状态',
        action: 'notify'
      },
      {
        id: 'contact',
        label: '联系客服',
        desc: '遇到问题时找我们',
        openType: 'contact'
      }
    ],
    settings: [
      {
        id: 'privacy',
        label: '隐私与协议',
        desc: '账号安全和数据说明',
        action: 'privacy'
      }
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
      this.setData({ userInfo })
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

  requestSubscribe() {
    const app = getApp()
    const tmplIds = (app.globalData && app.globalData.subscribeTmplIds) || []
    if (!tmplIds.length) {
      wx.showToast({
        title: '暂无可订阅的消息模板',
        icon: 'none'
      })
      return
    }
    wx.requestSubscribeMessage({
      tmplIds,
      complete: (res) => {
        const accepted = tmplIds.some(id => res[id] === 'accept')
        wx.showToast({
          title: accepted ? '已开启提醒' : '未开启提醒',
          icon: accepted ? 'success' : 'none'
        })
      }
    })
  },

  onOfficialAccountLoad() {
    console.log('[me] official account component loaded')
  },

  onOfficialAccountError(event) {
    console.log('[me] official account component error', event.detail)
  },

  handleMenuTap(event) {
    const action = event.currentTarget.dataset.action
    if (!action) {
      return
    }
    if (action === 'book') {
      this.navToStudy()
      return
    }
    if (action === 'notify') {
      this.requestSubscribe()
      return
    }
    if (action === 'privacy') {
      this.showPending()
    }
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
