const { getUserInfo, reportSubscribeMessageQuota } = require('../../utils/api')
const { login } = require('../../utils/login')
const {
  getCheckinRemindTmplId,
  getSubscribePref,
  setSubscribePref,
  getSubscribeQuota,
  bumpSubscribeQuota,
  CHECKIN_REMIND_TIME
} = require('../../utils/subscribe')
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
const { APP_LOGO_SRC } = require('../../utils/app-brand')
const {
  saveImageWithAlbumPermission
} = require('../../utils/photos-album-permission')

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const DEFAULT_AVATAR = '../../images/home/mascot-report-jelly.png'
const DEFAULT_SHARE_NICKNAME = '爱学习的小词友'

// canvas.createImage 需要绝对路径，页面相对路径转为根路径
function toCanvasImageSrc(src) {
  return src ? src.replace(/^\.\.\/\.\.\//, '/') : src
}

const { getLearnedWordCount } = require('../../utils/learned-progress')
// 累计已学词数（与首页同口径，书目信息缺失时取演示值）
function pickLearnedWords(book) {
  const learned = getLearnedWordCount(book)
  if (learned > 0) {
    return learned
  }
  const total = Number(book && book.wordCount)
  return Number.isFinite(total) && total > 0 ? Math.min(1413, total) : 1413
}
const STREAK_REWARD_DAYS = 30
const STREAK_REWARD_CODE = 'TSZXVIP5D'
const CHECKIN_REMIND_COUNT_KEY = 'checkinRemindCount'
const CHECKIN_REMIND_PREF_KEY = 'subscribePref_checkin'
const DEFAULT_REWARD_SCENARIO_ID = 'claimable'
const REWARD_SCENARIOS = [
  { id: 'locked', label: '未达标', continuousDays: 18, giftClaimed: false },
  { id: 'claimable', label: '可领取', continuousDays: 34, giftClaimed: false },
  { id: 'claimed', label: '已领取', continuousDays: 34, giftClaimed: true }
]

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

function pickRewardClaimed(data) {
  const candidates = [
    data.giftClaimed,
    data.rewardClaimed,
    data.streakRewardClaimed,
    data.vipRewardClaimed,
    data.hasClaimedReward,
    data.rewardReceived
  ]

  for (let i = 0; i < candidates.length; i++) {
    const value = candidates[i]
    if (value === true || value === 1 || value === '1' || value === 'true') {
      return true
    }
    if (value === false || value === 0 || value === '0' || value === 'false') {
      return false
    }
  }

  const status = String(data.rewardStatus || data.streakRewardStatus || '').toLowerCase()
  return status === 'claimed' || status === 'received'
}

function getRewardScenario(id) {
  const target = id || DEFAULT_REWARD_SCENARIO_ID
  for (let i = 0; i < REWARD_SCENARIOS.length; i++) {
    if (REWARD_SCENARIOS[i].id === target) {
      return REWARD_SCENARIOS[i]
    }
  }
  return REWARD_SCENARIOS[1]
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
    checkinRemindCount: 0,
    checkinRemindEnabled: true,
    bookName: '',
    avatarUrl: '',
    avatarSrc: DEFAULT_AVATAR,
    rewardDay: STREAK_REWARD_DAYS,
    rewardScenarios: REWARD_SCENARIOS,
    rewardScenarioId: DEFAULT_REWARD_SCENARIO_ID,
    giftUnlocked: false,
    giftClaimed: false,
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
      { id: 'words', label: '词句刷刷刷' },
      { id: 'monsterLight', label: '小怪兽·浅色' },
      { id: 'pkLight', label: 'PK·浅色' },
      { id: 'wordsLight', label: '词句·浅色' }
    ],
    sharePosterPaths: {
      monster: '',
      pk: '',
      words: '',
      monsterLight: '',
      pkLight: '',
      wordsLight: ''
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
      bookName: book.name || '当前教材',
      checkinRemindCount: getSubscribeQuota(CHECKIN_REMIND_COUNT_KEY),
      checkinRemindEnabled: getSubscribePref(CHECKIN_REMIND_PREF_KEY)
    }))
    this.applyRewardScenario(DEFAULT_REWARD_SCENARIO_ID)
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
        giftClaimed: pickRewardClaimed(info),
        rewardCode: pickRewardCode(info),
        nickName: info.nickName || '',
        avatarUrl: pickAvatarUrl(info),
        avatarSrc: pickAvatarUrl(info) || DEFAULT_AVATAR
      })
      this.applyRewardScenario(this.data.rewardScenarioId || DEFAULT_REWARD_SCENARIO_ID)
    }).catch(error => {
      console.log('[checkin-calendar] demo fallback', error)
      this.applyRewardScenario(this.data.rewardScenarioId || DEFAULT_REWARD_SCENARIO_ID)
    })
  },

  applyRewardScenario(id) {
    const scenario = getRewardScenario(id)
    this.checkedDates = buildRecentCheckedDates(scenario.continuousDays, this.today)
    this.setData({
      rewardScenarioId: scenario.id,
      continuousDays: scenario.continuousDays,
      giftClaimed: scenario.giftClaimed,
      showGiftDialog: false,
      giftCopied: false
    })
    this.renderCalendar()
  },

  switchRewardScenario(event) {
    const id = event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.id
    this.applyRewardScenario(id)
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

  // 「开启打卡提醒」：一次性订阅消息，用户每同意一次就累计一次推送额度。
  subscribeCheckinRemind() {
    const tmplId = getCheckinRemindTmplId()
    if (!tmplId) {
      wx.showToast({ title: '暂未配置打卡提醒模板', icon: 'none' })
      return
    }
    if (typeof wx.requestSubscribeMessage !== 'function') {
      wx.showToast({ title: '当前微信版本不支持', icon: 'none' })
      return
    }
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      success: (res) => {
        if (res[tmplId] === 'accept') {
          const count = bumpSubscribeQuota(CHECKIN_REMIND_COUNT_KEY, 1)
          setSubscribePref(CHECKIN_REMIND_PREF_KEY, true)
          this.setData({ checkinRemindCount: count, checkinRemindEnabled: true })
          // 预留后端：上报本次订阅，后端据此累计推送额度（接口就绪前为空操作）
          reportSubscribeMessageQuota({
            tmplId,
            delta: 1,
            total: count,
            source: 'accumulate',
            remindTime: CHECKIN_REMIND_TIME,
            page: '/pages/checkin/calendar'
          })
          wx.showToast({ title: '已累计 ' + count + ' 次提醒', icon: 'success' })
        } else if (res[tmplId] === 'reject') {
          wx.showToast({ title: '已拒绝打卡提醒', icon: 'none' })
        }
      },
      fail: (error) => {
        console.log('[checkin-calendar] subscribe remind failed', error)
        // 多因用户曾勾选「总是保持以上选择」或关闭了订阅总开关，引导去设置重新允许
        wx.showModal({
          title: '打卡提醒未能开启',
          content: '请在设置中允许「订阅消息」后再来累计提醒次数。',
          confirmText: '去设置',
          success: (modalRes) => {
            if (modalRes.confirm && typeof wx.openSetting === 'function') {
              wx.openSetting()
            }
          }
        })
      }
    })
  },

  toggleCheckinRemindPref(event) {
    const enabled = !!(event && event.detail && event.detail.value)
    setSubscribePref(CHECKIN_REMIND_PREF_KEY, enabled)
    this.setData({ checkinRemindEnabled: enabled })
    wx.showToast({
      title: enabled ? '已开启打卡提醒' : '已关闭打卡提醒',
      icon: 'none'
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

  openCalendarDay(event) {
    const dataset = (event && event.currentTarget && event.currentTarget.dataset) || {}
    if (dataset.isReward === true || dataset.isReward === 'true') {
      this.openGiftDialog()
    }
  },

  openGiftDialog() {
    this.setData({ showGiftDialog: true, giftCopied: false })
  },

  closeGiftDialog() {
    this.setData({ showGiftDialog: false })
  },

  // 点击「立即领取」：原地切换到「已领取」弹窗（兑换码视图），弹窗不关闭
  claimReward() {
    if (this.data.giftClaimed) {
      return
    }
    this.setData({
      giftClaimed: true,
      rewardScenarioId: 'claimed',
      giftCopied: false
    })
    wx.showToast({ title: '领取成功', icon: 'success' })
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

  openShareDialog() {
    this.posterCache = {}
    this.setData({
      showShareDialog: true,
      shareThemeIndex: 0,
      shareTheme: POSTER_THEMES[0],
      sharePosterPaths: {
        monster: '',
        pk: '',
        words: '',
        monsterLight: '',
        pkLight: '',
        wordsLight: ''
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
    // 不整体清空图片（image 节点一卸载 swiper 会生硬复位），
    // 新模式已缓存的直接换上，没缓存的先留旧图占位，渲染完成后原地换 src；
    // 同时显式把 swiper 平滑滚回第一张。
    const cache = this.posterCache || {}
    const nextPaths = {}
    POSTER_THEMES.forEach(theme => {
      nextPaths[theme] = cache[mode + ':' + theme] || this.data.sharePosterPaths[theme] || ''
    })
    this.setData({
      shareMode: mode,
      shareThemeIndex: 0,
      shareTheme: POSTER_THEMES[0],
      sharePosterPaths: nextPaths
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
      logoSrc: APP_LOGO_SRC,
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

  // 仅返回当前模式下渲染完成的海报路径，避免存到旧模式的占位图
  getFreshPosterPath() {
    const cache = this.posterCache || {}
    const key = this.data.shareMode + ':' + this.data.shareTheme
    const path = this.data.sharePosterPaths[this.data.shareTheme]
    return path && cache[key] === path ? path : ''
  },

  saveShareImage() {
    const path = this.getFreshPosterPath()
    if (!path) {
      wx.showToast({ title: '海报生成中…', icon: 'none' })
      return
    }
    saveImageWithAlbumPermission(path)
  },

  sendShareImage() {
    const path = this.getFreshPosterPath()
    if (!path) {
      wx.showToast({ title: '海报生成中…', icon: 'none' })
      return
    }
    if (typeof wx.showShareImageMenu === 'function') {
      wx.showShareImageMenu({ path })
    } else {
      // 低版本基础库兜底：预览后长按可转发
      wx.previewImage({ urls: [path] })
    }
  }
})
