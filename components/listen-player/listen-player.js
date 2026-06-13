// 随身听全屏播放器覆盖层（从 pages/listen 抽出播放器模式）。
// 挂在 custom-tab-bar 内、不走页面路由：navigateTo/navigateBack 的系统转场
// 是横向 push 且无法关闭，会破坏"从下到上"的出现/收起效果，
// 覆盖层的开合就是纯 CSS 上滑/下滑。播放仍委托全局单例 player。
const { login } = require('../../utils/login')
const { player } = require('../../utils/player')
const { IMAGE_BASE_URL } = require('../../utils/image-host')
const LISTEN_WORD_TAG_IMAGE = IMAGE_BASE_URL + '/images/listen/tag-word-jelly.png'
const LISTEN_SENTENCE_TAG_IMAGE = IMAGE_BASE_URL + '/images/listen/tag-sentence-jelly.png'

// 与 wxss 里 listen-slide-down 动画时长一致
const ANIM_OUT_MS = 300

Component({
  options: {
    // 允许上层通用样式进入，但播放器自身样式不能泄漏到页面/原生组件。
    styleIsolation: 'apply-shared'
  },

  data: {
    imageBaseUrl: IMAGE_BASE_URL,
    listenWordTagImage: LISTEN_WORD_TAG_IMAGE,
    listenSentenceTagImage: LISTEN_SENTENCE_TAG_IMAGE,
    visible: false,
    pageAnimState: 'listen-page-preenter',
    statusBarHeight: wx.getStorageSync('statusBarHeight') || 0,
    navigationBarHeight: wx.getStorageSync('navigationBarHeight') || 0,
    safeAreaBottom: Math.max((wx.getStorageSync('windowHeight') || 0) - ((wx.getStorageSync('safeArea') || {}).bottom || wx.getStorageSync('windowHeight') || 0), 0),

    loading: true,
    bookCover: '../../images/home/book-cover.png',

    // 期（单元）列表
    units: [],
    unitIndex: 0,
    unitName: '随身听',

    // 当前期的播放列表（单词 + 例句，顺序混排）
    tracks: [],
    current: 0,

    // 播放状态
    playing: false,
    currentPage: 0, // swiper：0 封面，1 课文
    progress: 0, // 0 - 100，覆盖整期
    currentTime: '00:00',

    speedIndex: 0,
    speedLabel: '1.0x',

    loopIndex: 0,
    loopLabel: '列',

    showPlaylist: false,

    // 课文页：跟读测评展开项（-1 表示未展开）及各句得分缓存
    expandedIndex: -1,
    trackScores: {},
    // 课文滚动位置（受控 scroll-top）。激活/展开时只在必要时滚动，不再贴顶
    scrollTop: 0
  },

  lifetimes: {
    attached() {
      this.closing = false
      this.onPlayerState = this.onPlayerState.bind(this)
    },
    detached() {
      player.unsubscribe(this.onPlayerState)
    }
  },

  methods: {
    /* ----------------------------- 开合 ----------------------------- */

    open(opts) {
      opts = opts || {}
      if (this.data.visible && !this.closing) {
        return
      }
      this.closing = false
      const book = (getApp().globalData && getApp().globalData.book) || {}
      const resBookId = opts.resBookId || book.resBookId || ''
      const bookCover = book.bookCover || this.data.bookCover
      this.setData({
        visible: true,
        bookCover,
        pageAnimState: 'listen-page-preenter'
      }, () => {
        this.measureSeekBar()
        setTimeout(() => {
          if (this.closing) {
            return
          }
          this.setData({ pageAnimState: 'listen-page-enter' })
        }, 20)
      })
      // subscribe 自带去重并立即推送一次快照
      player.subscribe(this.onPlayerState)
      login().then(() => player.start({
        resBookId,
        bookCover,
        targetUnitId: opts.targetUnitId || ''
      }))
    },

    close() {
      if (this.closing || !this.data.visible) {
        return
      }
      this.closing = true
      this.setData({ pageAnimState: 'listen-page-leaving', showPlaylist: false })
      setTimeout(() => {
        if (!this.closing) {
          return
        }
        this.closing = false
        // 仅退订并隐藏，音频交由全局单例继续播放（迷你播放器仍可控制）
        player.unsubscribe(this.onPlayerState)
        this.setData({
          visible: false,
          expandedIndex: -1,
          pageAnimState: 'listen-page-preenter'
        })
      }, ANIM_OUT_MS)
    },

    /* ----------------------------- 全局播放器状态 -> 视图 ----------------------------- */

    onPlayerState(s) {
      const prevCurrent = this.data.current
      const prevUnitIndex = this.data.unitIndex
      this.setData({
        loading: !s.active,
        unitName: s.unitName,
        bookCover: s.bookCover,
        units: s.units,
        unitIndex: s.unitIndex,
        tracks: s.tracks,
        current: s.current,
        playing: s.playing,
        progress: s.progress,
        currentTime: s.currentTime,
        speedIndex: s.speedIndex,
        speedLabel: s.speedLabel,
        loopIndex: s.loopIndex,
        loopLabel: s.loopLabel
      })
      // 切换期：清空展开面板与该期的得分缓存
      if (s.unitIndex !== prevUnitIndex) {
        this.setData({ expandedIndex: -1, trackScores: {} })
      }
      if (s.current !== prevCurrent) {
        this.scrollToCurrent()
      }
    },

    /* ----------------------------- 播放控制（委托全局单例） ----------------------------- */

    togglePlay() {
      player.toggle()
    },

    playPrev() {
      player.prev()
    },

    playNext() {
      player.next()
    },

    onTrackTap(e) {
      const index = Number(e.currentTarget.dataset.index)
      // 再次点击已展开的句子：收起
      if (this.data.expandedIndex === index) {
        this.setData({ expandedIndex: -1 })
        return
      }
      // 点击文字直接展开：暂停随身听，同步进度条到该条，展开后由 media 自动播放标准音
      if (this.data.playing) {
        player.pause()
      }
      player.focusTrack(index)
      this.setData({ expandedIndex: index }, () => {
        this.scrollToIndex(index)
      })
    },

    /* ----------------------------- 跟读测评（复用 media 组件 / 驰声引擎） ----------------------------- */

    // 跟读/试听/录音时暂停随身听示范音，避免与跟读音重叠
    onMediaStateChange(e) {
      if (e.detail.state !== 0 && this.data.playing) {
        player.pause()
      }
    },

    // 评测返回：缓存该句得分，重新展开时回显
    onMediaResult(e) {
      const { index, score } = e.detail
      if (index == null) {
        return
      }
      this.setData({
        ['trackScores[' + index + ']']: score
      })
    },

    // 录音未授权：提示去设置开启
    onMediaUnauthorized(e) {
      const dialog = (e.detail && e.detail.dialog) || {}
      wx.showModal({
        title: dialog.title || '提示',
        content: dialog.content || '未授权录音功能，无法录音评分，请完成授权。',
        confirmText: dialog.confirmText || '去授权',
        cancelText: dialog.cancelText || '取消',
        success: res => {
          if (res.confirm) {
            wx.openSetting()
          }
        }
      })
    },

    scrollToCurrent() {
      this.scrollToIndex(this.data.current)
    },

    // 激活/展开时把条目带进可视区——但只在被遮挡时滚动，且保留顶部留白，
    // 不再把条目硬顶到最上面（那样会丢失上下文，观感很差）
    scrollToIndex(index) {
      const q = this.createSelectorQuery()
      q.select('.lyrics').fields({ rect: true, size: true, scrollOffset: true })
      q.select('#track-' + index).boundingClientRect()
      q.exec(res => {
        const view = res && res[0]
        const item = res && res[1]
        if (!view || !item) {
          return
        }
        const margin = view.height * 0.12 // 顶部/底部留白，避免贴边
        const itemTop = item.top - view.top // 相对可视区顶部
        const itemBottom = item.bottom - view.top
        let target = view.scrollTop
        if (item.height > view.height - margin) {
          // 展开后比可视区还高：让条目顶部停在留白处，优先露出句子+面板上半
          target = view.scrollTop + itemTop - margin
        } else if (itemBottom > view.height) {
          // 下方（含展开面板）被截断：上滚刚好露出，并留底边距
          target = view.scrollTop + (itemBottom - view.height) + margin
        } else if (itemTop < margin) {
          // 顶部被截断或贴顶：下滚到留白处
          target = view.scrollTop + itemTop - margin
        } else {
          // 已在可视区内：不滚动
          return
        }
        if (target < 0) {
          target = 0
        }
        this.setData({ scrollTop: target })
      })
    },

    /* ----------------------------- 进度条 ----------------------------- */

    measureSeekBar() {
      this.createSelectorQuery().select('.seek').boundingClientRect(rect => {
        if (rect && rect.width) {
          this.seekRect = rect
        }
      }).exec()
    },

    onSeekStart(e) {
      if (!this.data.tracks.length) {
        return
      }
      if (!this.seekRect) {
        this.measureSeekBar()
      }
      player.setSeeking(true)
      this.previewSeek(e)
    },

    onSeekMove(e) {
      this.previewSeek(e)
    },

    onSeekEnd(e) {
      const value = this.valueFromTouch(e)
      player.setSeeking(false)
      if (value != null) {
        player.seekToValue(value)
      }
    },

    valueFromTouch(e) {
      const rect = this.seekRect
      const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
      if (!rect || !rect.width || !touch) {
        return null
      }
      let ratio = (touch.clientX - rect.left) / rect.width
      ratio = Math.min(Math.max(ratio, 0), 1)
      return ratio * 100
    },

    // 拖动时仅更新进度条外观，不打断当前播放
    previewSeek(e) {
      const value = this.valueFromTouch(e)
      if (value != null) {
        player.previewSeek(value)
      }
    },

    /* ----------------------------- 倍速 / 循环 ----------------------------- */

    toggleSpeed() {
      player.toggleSpeed()
    },

    toggleLoop() {
      player.toggleLoop()
    },

    /* ----------------------------- 期切换面板 ----------------------------- */

    openPlaylist() {
      this.setData({ showPlaylist: true })
    },

    closePlaylist() {
      this.setData({ showPlaylist: false })
    },

    onUnitTap(e) {
      const index = Number(e.currentTarget.dataset.index)
      this.setData({ showPlaylist: false })
      player.selectUnit(index)
    },

    noop() {},

    onSwiperChange(e) {
      this.setData({ currentPage: e.detail.current })
    }
  }
})
