const { player } = require('../utils/player')

function getSafeAreaBottom() {
  const systemInfo = wx.getSystemInfoSync()
  if (!systemInfo.safeArea) {
    return 0
  }
  return Math.max(systemInfo.windowHeight - systemInfo.safeArea.bottom, 0)
}

Component({
  data: {
    selected: 0,
    hidden: false,
    safeAreaBottom: 0,

    // 迷你播放器（随身听正在播放时悬浮于底栏之上）
    miniActive: false,
    miniPlaying: false,
    miniTitle: '',
    miniCover: '',
    miniProgress: 0
  },

  lifetimes: {
    attached() {
      this.setData({ safeAreaBottom: getSafeAreaBottom() })
      this.onPlayerState = this.onPlayerState.bind(this)
      player.subscribe(this.onPlayerState)
    },

    detached() {
      player.unsubscribe(this.onPlayerState)
    }
  },

  methods: {
    onPlayerState(s) {
      const track = s.currentTrack
      this.setData({
        miniActive: s.started,
        miniPlaying: s.playing,
        miniTitle: (track && track.content) || s.unitName || '随身听',
        miniCover: s.bookCover,
        miniProgress: s.progress
      })
    },

    switchTab(event) {
      const path = event.currentTarget.dataset.path
      wx.switchTab({ url: path })
    },

    // 进入随身听：压栈打开，由 listen 页自己做自下而上入场动画。
    openListen() {
      const resBookId = player.active
        ? player.resBookId
        : ((getApp().globalData && getApp().globalData.book) || {}).resBookId
      if (!resBookId) {
        wx.showToast({ title: '内容待补充', icon: 'none' })
        return
      }

      const pages = getCurrentPages()
      const top = pages[pages.length - 1]
      if (top && top.route === 'pages/listen/listen') {
        return
      }

      wx.navigateTo({
        url: '/pages/listen/listen?resBookId=' + resBookId
      })
    },

    goListen() {
      this.openListen()
    },

    // 迷你播放器上的播放/暂停（阻止冒泡，避免触发跳转）
    toggleMiniPlay() {
      player.toggle()
    }
  }
})
