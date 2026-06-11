const { getUserInfo } = require('../../utils/api')
const { login } = require('../../utils/login')
const {
  DEMO_CONTINUOUS_DAYS,
  buildCalendarDays,
  buildCheckinSummary,
  buildDemoCheckedDates,
  buildRecentCheckedDates,
  formatDate,
  normalizeCheckedDates
} = require('./calendar-data')
const { drawPoster, getDailyQuote, POSTER_THEMES } = require('./share-poster')
const { LEVEL_SIZE, getTodayDone } = require('../../utils/checkin-progress')

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const DEFAULT_AVATAR = '../../images/home/mascot-report-jelly.png'
const SHARE_BADGE_SRC = '/images/home/icon-book-picker-jelly.png'
const DEFAULT_SHARE_NICKNAME = '爱学习的小词友'

// canvas.createImage 需要绝对路径，页面相对路径转为根路径
function toCanvasImageSrc(src) {
  return src ? src.replace(/^\.\.\/\.\.\//, '/') : src
}

function isPhotosAlbumPermissionError(error) {
  const message = String((error && error.errMsg) || error || '').toLowerCase()
  return message.indexOf('auth') >= 0 ||
    message.indexOf('authorize') >= 0 ||
    message.indexOf('deny') >= 0 ||
    message.indexOf('denied') >= 0 ||
    message.indexOf('permission') >= 0
}

// 累计掌握词数（与首页 getLearnedWordCount 同口径，书目信息缺失时取演示值）
function pickLearnedWords(book) {
  const learningInfo = (book && book.learningInfo) || {}
  const bookProgress = learningInfo.book || {}
  const learned = Number(bookProgress.learningWords || bookProgress.wordCount)
  if (Number.isFinite(learned) && learned > 0) {
    return learned
  }
  const total = Number(book && book.wordCount)
  return Number.isFinite(total) && total > 0 ? Math.min(1413, total) : 1413
}
const STREAK_REWARD_DAYS = 30
const STREAK_REWARD_CODE = 'TSZXVIP5D'

function getSafeArea() {
  const systemInfo = wx.getSystemInfoSync()
  const safeArea = systemInfo.safeArea || {}
  return {
    safeAreaTop: safeArea.top || systemInfo.statusBarHeight || 0,
    safeAreaBottom: safeArea.bottom
      ? Math.max(systemInfo.windowHeight - safeArea.bottom, 0)
      : 0
  }
}

function getNavLayout() {
  const systemInfo = wx.getSystemInfoSync()
  const statusBarHeight = Number(systemInfo.statusBarHeight) || 0
  const windowWidth = Number(systemInfo.windowWidth) || 375
  const storedNavHeight = Number(wx.getStorageSync('navigationBarHeight'))
  let navigationBarHeight = storedNavHeight > 0
    ? storedNavHeight
    : (systemInfo.platform === 'android' ? 48 : 40)

  let navActionsRight = 24
  if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
    const menuButton = wx.getMenuButtonBoundingClientRect() || {}
    const menuLeft = Number(menuButton.left)
    if (menuLeft > 0) {
      navActionsRight = Math.max(Math.ceil(windowWidth - menuLeft + 12), 24)
    }
    const menuTop = Number(menuButton.top)
    const menuHeight = Number(menuButton.height)
    if (menuTop > 0 && menuHeight > 0) {
      navigationBarHeight = Math.max(navigationBarHeight, (menuTop - statusBarHeight) * 2 + menuHeight)
    }
  }

  return {
    statusBarHeight,
    navigationBarHeight,
    navBarHeightPx: statusBarHeight + navigationBarHeight,
    navActionsRight
  }
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

function pickCheckinDates(data) {
  const candidates = [
    data.checkInDates,
    data.signDates,
    data.calendar,
    data.records
  ]

  for (let i = 0; i < candidates.length; i++) {
    const dates = normalizeCheckedDates(candidates[i])
    if (dates.length) {
      return dates
    }
  }

  return []
}

function pickAvatarUrl(data) {
  return data.avatarUrl || data.avatar || data.headImg || data.headImage || ''
}

function pickRewardCode(data) {
  return data.streakRewardCode || data.vipRedeemCode || data.rewardCode || STREAK_REWARD_CODE
}

function pickPracticeUnitId(book) {
  const learningInfo = (book && book.learningInfo) || {}
  const candidates = [
    learningInfo.current && learningInfo.current.unitId,
    learningInfo.next && learningInfo.next.unitId,
    learningInfo.book && learningInfo.book.currentUnitId,
    learningInfo.book && learningInfo.book.learningUnits
  ]

  for (let i = 0; i < candidates.length; i++) {
    const value = Number(candidates[i])
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }

  return 0
}

Page({
  data: {
    safeAreaTop: 0,
    safeAreaBottom: 0,
    statusBarHeight: 0,
    navigationBarHeight: 0,
    navBarHeightPx: 0,
    navActionsRight: 24,
    weekdays: WEEKDAYS,
    yearMonth: '',
    calendarDays: [],
    checkedDays: 0,
    monthDays: 0,
    progressPercent: 0,
    continuousDays: 0,
    displayContinuousDays: 1,
    todayChecked: false,
    bookName: '',
    avatarUrl: '',
    avatarSrc: DEFAULT_AVATAR,
    rewardDay: STREAK_REWARD_DAYS,
    giftUnlocked: false,
    showGiftDialog: false,
    showRulesDialog: false,
    giftCopied: false,
    rewardRemainingDays: STREAK_REWARD_DAYS,
    rewardProgressPercent: 0,
    rewardCode: STREAK_REWARD_CODE,
    nickName: '',
    showShareDialog: false,
    shareMode: 'streak',
    shareThemeIndex: 0,
    shareTheme: 'monster',
    shareThemes: [
      { id: 'monster', label: '小怪兽' },
      { id: 'pk', label: 'PK' },
      { id: 'words', label: '词句刷刷刷' }
    ],
    sharePosterPaths: {
      monster: '',
      pk: '',
      words: ''
    }
  },

  onLoad() {
    this.today = new Date()
    this.viewDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1)
    this.checkedDates = []
    const app = getApp()
    const book = (app.globalData && app.globalData.book) || {}
    this.book = book

    this.setData(Object.assign(getSafeArea(), getNavLayout(), {
      bookName: book.name || '当前教材'
    }))
    this.renderCalendar()
    this.loadCheckin()
  },

  renderCalendar() {
    const calendarDays = buildCalendarDays(this.viewDate, this.checkedDates, this.today)
    const summary = buildCheckinSummary(calendarDays)
    const displayContinuousDays = Math.max(
      Number(this.data.continuousDays) || 0,
      summary.checkedDays,
      1
    )

    this.setData(Object.assign({
      yearMonth: formatDate(this.viewDate).slice(0, 7).replace('-', '年') + '月',
      calendarDays,
      displayContinuousDays,
      giftUnlocked: displayContinuousDays >= STREAK_REWARD_DAYS,
      rewardRemainingDays: this.getRewardRemainingDays(displayContinuousDays),
      rewardProgressPercent: Math.min(
        Math.round(displayContinuousDays * 100 / STREAK_REWARD_DAYS),
        100
      )
    }, summary))
  },

  loadCheckin() {
    login().then(result => {
      if (!result || !result.logined) {
        return null
      }
      return getUserInfo()
    }).then(data => {
      const info = data || {}
      let continuousDays = pickNumber(info.continuousDays, info.checkInDays, info.signDays)
      const apiDates = pickCheckinDates(info)

      if (apiDates.length) {
        this.checkedDates = apiDates
      } else if (continuousDays > 0) {
        this.checkedDates = buildRecentCheckedDates(continuousDays, this.today)
      } else {
        // 未登录或接口没有打卡记录时，用演示打卡数据兜底
        this.checkedDates = buildDemoCheckedDates(this.today)
        continuousDays = DEMO_CONTINUOUS_DAYS
      }

      this.setData({
        continuousDays,
        rewardCode: pickRewardCode(info),
        nickName: info.nickName || '',
        avatarUrl: pickAvatarUrl(info),
        avatarSrc: pickAvatarUrl(info) || DEFAULT_AVATAR
      })
      this.renderCalendar()
    }).catch(error => {
      console.log('[checkin-calendar] demo fallback', error)
      this.checkedDates = buildDemoCheckedDates(this.today)
      this.setData({ continuousDays: DEMO_CONTINUOUS_DAYS })
      this.renderCalendar()
    })
  },

  changeMonth(offset) {
    const value = Number(offset)
    const current = this.viewDate || this.today || new Date()
    this.viewDate = new Date(current.getFullYear(), current.getMonth() + value, 1)
    this.renderCalendar()
  },

  prevMonth() {
    this.changeMonth(-1)
  },

  nextMonth() {
    this.changeMonth(1)
  },

  startLearning() {
    const book = this.book || {}
    const unitId = pickPracticeUnitId(book)

    if (!book.resBookId || !unitId) {
      wx.switchTab({ url: '/pages/home/home' })
      return
    }

    wx.navigateTo({
      url: '/pages/practice/practice?resBookId=' + book.resBookId +
        '&unitId=' + unitId +
        '&name=' + encodeURIComponent(book.name || this.data.bookName) +
        '&taskType=word'
    })
  },

  back() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/home/home' })
    }
  },

  getRewardRemainingDays(continuousDays) {
    return Math.max(STREAK_REWARD_DAYS - (Number(continuousDays) || 0), 0)
  },

  openRulesDialog() {
    this.setData({ showRulesDialog: true })
  },

  closeRulesDialog() {
    this.setData({ showRulesDialog: false })
  },

  openGiftDialog() {
    this.setData({ showGiftDialog: true, giftCopied: false })
  },

  closeGiftDialog() {
    this.setData({ showGiftDialog: false })
  },

  copyRewardCode() {
    const code = this.data.rewardCode || STREAK_REWARD_CODE
    wx.setClipboardData({
      data: code,
      success: () => {
        this.setData({ giftCopied: true })
        wx.showToast({
          title: '兑换码已复制',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  showPhotosAlbumSettingDialog() {
    return new Promise(resolve => {
      wx.showModal({
        title: '需要相册权限',
        content: '请在设置中允许保存图片到相册',
        confirmText: '去设置',
        success: res => {
          if (!res.confirm) {
            resolve(false)
            return
          }
          wx.openSetting({
            success: setting => {
              const authSetting = (setting && setting.authSetting) || {}
              resolve(authSetting['scope.writePhotosAlbum'] === true)
            },
            fail: () => resolve(false)
          })
        },
        fail: () => resolve(false)
      })
    })
  },

  ensurePhotosAlbumPermission() {
    return new Promise(resolve => {
      wx.getSetting({
        success: setting => {
          const authSetting = (setting && setting.authSetting) || {}
          const status = authSetting['scope.writePhotosAlbum']
          if (status === true) {
            resolve(true)
            return
          }
          if (status === false) {
            this.showPhotosAlbumSettingDialog().then(resolve)
            return
          }
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => resolve(true),
            fail: () => this.showPhotosAlbumSettingDialog().then(resolve)
          })
        },
        fail: () => {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => resolve(true),
            fail: () => this.showPhotosAlbumSettingDialog().then(resolve)
          })
        }
      })
    })
  },

  openShareDialog() {
    this.posterCache = {}
    this.setData({
      showShareDialog: true,
      shareThemeIndex: 0,
      shareTheme: POSTER_THEMES[0],
      sharePosterPaths: {
        monster: '',
        pk: '',
        words: ''
      }
    })
    this.sharePosterQueue = Promise.resolve()
    POSTER_THEMES.forEach(theme => this.enqueueSharePosterRender(theme))
  },

  closeShareDialog() {
    this.setData({ showShareDialog: false })
  },

  switchShareMode(event) {
    const mode = event.currentTarget.dataset.mode
    if (!mode || mode === this.data.shareMode) {
      return
    }
    this.setData({
      shareMode: mode,
      sharePosterPaths: {
        monster: '',
        pk: '',
        words: ''
      }
    })
    this.sharePosterQueue = Promise.resolve()
    POSTER_THEMES.forEach(theme => this.enqueueSharePosterRender(theme))
  },

  onShareThemeSwipe(event) {
    const index = Number(event.detail.current)
    const theme = POSTER_THEMES[index]
    if (!theme || index === this.data.shareThemeIndex) {
      return
    }
    this.setData({
      shareThemeIndex: index,
      shareTheme: theme
    })
    if (!this.data.sharePosterPaths[theme]) {
      this.enqueueSharePosterRender(theme)
    }
  },

  getShareCanvas() {
    if (!this.shareCanvasPromise) {
      this.shareCanvasPromise = new Promise((resolve, reject) => {
        this.createSelectorQuery()
          .select('#share-poster')
          .fields({ node: true })
          .exec(res => {
            const canvas = res && res[0] && res[0].node
            if (canvas) {
              resolve(canvas)
            } else {
              reject(new Error('share poster canvas not found'))
            }
          })
      })
    }
    return this.shareCanvasPromise
  },

  buildPosterOptions() {
    const systemInfo = wx.getSystemInfoSync()
    const book = this.book || {}
    const todayDone = getTodayDone(book.resBookId)
    return {
      mode: this.data.shareMode,
      theme: this.data.shareTheme,
      date: this.today,
      quote: getDailyQuote(this.today),
      nickName: this.data.nickName || DEFAULT_SHARE_NICKNAME,
      avatarSrc: toCanvasImageSrc(this.data.avatarSrc || DEFAULT_AVATAR),
      badgeSrc: SHARE_BADGE_SRC,
      continuousDays: this.data.displayContinuousDays,
      totalDays: (this.checkedDates || []).length,
      todayDone,
      todayWords: todayDone * LEVEL_SIZE,
      learnedWords: pickLearnedWords(book),
      dpr: Math.min(Number(systemInfo.pixelRatio) || 2, 3)
    }
  },

  enqueueSharePosterRender(theme) {
    const targetTheme = theme || this.data.shareTheme
    if (POSTER_THEMES.indexOf(targetTheme) < 0) {
      return
    }
    const mode = this.data.shareMode
    const cacheKey = mode + ':' + targetTheme
    const cache = this.posterCache || {}
    if (cache[cacheKey]) {
      this.setData({ ['sharePosterPaths.' + targetTheme]: cache[cacheKey] })
      return
    }

    this.sharePosterQueue = this.sharePosterQueue || Promise.resolve()
    this.sharePosterQueue = this.sharePosterQueue.then(() => this.renderSharePoster(targetTheme))
  },

  renderSharePoster(theme) {
    const targetTheme = theme || this.data.shareTheme
    const mode = this.data.shareMode
    const cacheKey = mode + ':' + targetTheme
    const cache = this.posterCache || {}

    this.setData({ ['sharePosterPaths.' + targetTheme]: '' })
    const options = Object.assign({}, this.buildPosterOptions(), { theme: targetTheme })
    return this.getShareCanvas().then(canvas => {
      return drawPoster(canvas, options).then(() => canvas)
    }).then(canvas => new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas,
        success: res => resolve(res.tempFilePath),
        fail: reject
      })
    })).then(path => {
      cache[cacheKey] = path
      if (this.data.showShareDialog && this.data.shareMode === mode) {
        this.setData({ ['sharePosterPaths.' + targetTheme]: path })
      }
    }).catch(error => {
      console.log('[checkin-calendar] share poster fallback', error)
      if (targetTheme === this.data.shareTheme) {
        wx.showToast({ title: '海报生成失败，请重试', icon: 'none' })
      }
    })
  },

  saveShareImage() {
    const path = this.data.sharePosterPaths[this.data.shareTheme]
    if (!path) {
      return
    }
    this.ensurePhotosAlbumPermission().then(allowed => {
      if (!allowed) {
        return
      }
      wx.saveImageToPhotosAlbum({
        filePath: path,
        success: () => {
          wx.showToast({ title: '已保存到相册', icon: 'success' })
        },
        fail: error => {
          const message = (error && error.errMsg) || ''
          if (isPhotosAlbumPermissionError(error)) {
            this.showPhotosAlbumSettingDialog()
          } else if (message.indexOf('cancel') < 0) {
            wx.showToast({ title: '保存失败，请重试', icon: 'none' })
          }
        }
      })
    })
  },

  sendShareImage() {
    const path = this.data.sharePosterPaths[this.data.shareTheme]
    if (!path) {
      return
    }
    if (typeof wx.showShareImageMenu === 'function') {
      this.ensurePhotosAlbumPermission().then(() => {
        wx.showShareImageMenu({ path })
      })
    } else {
      // 低版本基础库兜底：预览后长按可转发
      wx.previewImage({ urls: [path] })
    }
  }
})
