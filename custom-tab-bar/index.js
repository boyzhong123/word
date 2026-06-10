const { player } = require('../utils/player')

function getSafeAreaBottom() {
  const systemInfo = wx.getSystemInfoSync()
  if (!systemInfo.safeArea) {
    return 0
  }
  return Math.max(systemInfo.windowHeight - systemInfo.safeArea.bottom, 0)
}

// 由封面主色构造播放条渐变：左上提亮高光、右下压暗，参照随身听整页风格
function buildGradient(rgb) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  const mix = (c, target, t) => clamp(c + (target - c) * t)
  const [r, g, b] = rgb
  const lr = mix(r, 255, 0.34)
  const lg = mix(g, 255, 0.34)
  const lb = mix(b, 255, 0.34)
  const dr = mix(r, 0, 0.16)
  const dg = mix(g, 0, 0.16)
  const db = mix(b, 0, 0.16)
  return 'linear-gradient(135deg, rgb(' + lr + ',' + lg + ',' + lb + ') 0%, rgb(' +
    r + ',' + g + ',' + b + ') 52%, rgb(' + dr + ',' + dg + ',' + db + ') 100%)'
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
    miniProgress: 0,
    miniBg: ''
  },

  lifetimes: {
    // Component 顶层自定义字段不会挂到 this，必须在生命周期里初始化到实例上
    created() {
      this._coverColorCache = {} // key=封面地址，value=渐变串；避免每帧重复取色
      this._colorCover = ''
    },

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
        miniActive: s.active,
        miniPlaying: s.playing,
        miniTitle: (track && track.content) || s.unitName || '随身听',
        miniCover: s.bookCover,
        miniProgress: s.progress
      })
      // 封面变化时才取色（onPlayerState 每帧都触发，不能每次都算）
      if (s.active && s.bookCover && s.bookCover !== this._colorCover) {
        this._colorCover = s.bookCover
        this.applyCoverColor(s.bookCover)
      }
    },

    // 取封面主色作迷你播放条底色：命中缓存直接用，否则用 1×1 canvas 取平均色
    applyCoverColor(cover) {
      // 兜底：created 万一未执行也不至于读 undefined 报错
      if (!this._coverColorCache) {
        this._coverColorCache = {}
      }
      const cached = this._coverColorCache[cover]
      if (cached) {
        this.setData({ miniBg: cached })
        return
      }
      this.extractCoverColor(cover, (rgb) => {
        if (!rgb) {
          return
        }
        const bg = buildGradient(rgb)
        this._coverColorCache[cover] = bg
        // 取色是异步的，回来时封面可能已切走，确认仍是当前封面再应用
        if (this._colorCover === cover) {
          this.setData({ miniBg: bg })
        }
      })
    },

    extractCoverColor(cover, cb) {
      // 先把（可能是网络的）封面下到本地临时路径，再画进 canvas 读像素
      wx.getImageInfo({
        src: cover,
        success: (info) => {
          const query = this.createSelectorQuery()
          query.select('#miniColorCanvas').fields({ node: true }).exec((res) => {
            const node = res && res[0] && res[0].node
            if (!node) {
              cb(null)
              return
            }
            const canvas = node
            const ctx = canvas.getContext('2d')
            canvas.width = 1
            canvas.height = 1
            const img = canvas.createImage()
            img.onload = () => {
              try {
                // 整图缩到 1×1，单像素即全图平均色
                ctx.drawImage(img, 0, 0, 1, 1)
                const data = ctx.getImageData(0, 0, 1, 1).data
                cb([data[0], data[1], data[2]])
              } catch (e) {
                cb(null)
              }
            }
            img.onerror = () => cb(null)
            img.src = info.path
          })
        },
        fail: () => cb(null)
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
    },

    // 关闭迷你播放器：停止随身听（catchtap 阻止冒泡，避免触发跳转）
    closeMini() {
      player.stop()
    }
  }
})
