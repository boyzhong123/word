const { player } = require('../utils/player')

function getSafeAreaBottom() {
  const systemInfo = wx.getSystemInfoSync()
  if (!systemInfo.safeArea) {
    return 0
  }
  return Math.max(systemInfo.windowHeight - systemInfo.safeArea.bottom, 0)
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) {
    return [0, 0, l]
  }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6
  } else {
    h = ((r - g) / d + 4) / 6
  }
  return [h, s, l]
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  ]
}

// 封面平均色往往偏灰偏闷，先在 HSL 空间归一化（拉饱和、控亮度），
// 再构造「左上亮 → 主色 → 右下深」的渐变与同色系投影，保证白字可读且色彩鲜活
function buildCoverTheme(rgb) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  const [h, rawS, rawL] = rgbToHsl(rgb[0], rgb[1], rgb[2])
  const s = clamp(rawS * 1.45 + 0.08, 0.3, 0.66)
  const l = clamp(rawL, 0.4, 0.56)

  const light = hslToRgb(h, clamp(s * 0.9, 0, 1), clamp(l + 0.16, 0, 0.72))
  const base = hslToRgb(h, s, l)
  const deep = hslToRgb(h, clamp(s + 0.08, 0, 1), clamp(l - 0.15, 0.2, 1))
  const shadow = hslToRgb(h, clamp(s + 0.1, 0, 1), clamp(l - 0.24, 0.12, 1))

  const stop = (c) => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'
  return {
    bg: 'linear-gradient(120deg, ' + stop(light) + ' 0%, ' + stop(base) + ' 48%, ' + stop(deep) + ' 100%)',
    shadow: 'rgba(' + shadow[0] + ',' + shadow[1] + ',' + shadow[2] + ',0.38)'
  }
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
    miniBg: '',
    miniShadow: 'rgba(31, 45, 61, 0.2)'
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
        this.setData({ miniBg: cached.bg, miniShadow: cached.shadow })
        return
      }
      this.extractCoverColor(cover, (rgb) => {
        if (!rgb) {
          return
        }
        const theme = buildCoverTheme(rgb)
        this._coverColorCache[cover] = theme
        // 取色是异步的，回来时封面可能已切走，确认仍是当前封面再应用
        if (this._colorCover === cover) {
          this.setData({ miniBg: theme.bg, miniShadow: theme.shadow })
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

    // 进入随身听：压栈打开真正的随身听页。
    // tab 页里只保留迷你播放条，避免全屏播放器 DOM 污染首页/我的页。
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
