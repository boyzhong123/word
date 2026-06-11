const { getUserInfo } = require('../../utils/api')
const { login } = require('../../utils/login')
const {
  buildCalendarDays,
  buildCheckinSummary,
  buildRecentCheckedDates,
  formatDate,
  normalizeCheckedDates
} = require('./calendar-data')

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const DEFAULT_AVATAR = '../../images/home/mascot-report-jelly.png'
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
    rewardCode: STREAK_REWARD_CODE
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
      displayContinuousDays
    }, summary))
  },

  loadCheckin() {
    login().then(result => {
      if (!result || !result.logined) {
        return null
      }
      return getUserInfo()
    }).then(data => {
      if (!data) {
        return
      }

      const continuousDays = pickNumber(data.continuousDays, data.checkInDays, data.signDays)
      const apiDates = pickCheckinDates(data)
      this.checkedDates = apiDates.length
        ? apiDates
        : buildRecentCheckedDates(continuousDays, this.today)

      this.setData({
        continuousDays,
        giftUnlocked: continuousDays >= STREAK_REWARD_DAYS,
        rewardCode: pickRewardCode(data),
        avatarUrl: pickAvatarUrl(data),
        avatarSrc: pickAvatarUrl(data) || DEFAULT_AVATAR
      })
      this.renderCalendar()
    }).catch(error => {
      console.log('[checkin-calendar] load fallback', error)
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

  openGiftDialog() {
    if (!this.data.giftUnlocked) {
      wx.showToast({
        title: '连续打卡' + STREAK_REWARD_DAYS + '天可领取',
        icon: 'none'
      })
      return
    }
    this.setData({ showGiftDialog: true })
  },

  closeGiftDialog() {
    this.setData({ showGiftDialog: false })
  },

  copyRewardCode() {
    const code = this.data.rewardCode || STREAK_REWARD_CODE
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '兑换码已复制',
          icon: 'success'
        })
      }
    })
  }
})
