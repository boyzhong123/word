const {
  saveUserInfo,
  getUserInfo,
  getUserBooks,
  getUnits,
  toggleBook
} = require('../../utils/api')
const { login } = require('../../utils/login')
const {
  canUseUserProfile
} = require('../../utils/util')
const {
  buildDisplayUnits,
  buildListUnits,
  markTodayTasks,
  groupListUnits,
  buildMapTrail,
  getNextVisibleCount
} = require('./home-units')
const { normalizeCheckedDates } = require('../checkin/calendar-data')
const { getTodayDone, getDailyGoal } = require('../../utils/checkin-progress')

function positiveNumber() {
  for (let i = 0; i < arguments.length; i++) {
    const value = Number(arguments[i])
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }
  return 0
}

function countCheckinDates(info) {
  const candidates = [
    info.checkInDates,
    info.signDates,
    info.calendar,
    info.records
  ]
  for (let i = 0; i < candidates.length; i++) {
    const dates = normalizeCheckedDates(candidates[i])
    if (dates.length) {
      return dates.length
    }
  }
  return 0
}

const FALLBACK_BOOK = {
  name: '小学英语图解词汇词典',
  bookCover: '../../images/home/book-cover.png',
  wordCount: 6392,
  proverbCount: 1413,
  resBookId: '',
  learningInfo: {
    book: {
      learningUnits: 1
    },
    current: {
      unitId: 0
    },
    next: {
      unitId: 0
    }
  }
}

const FALLBACK_UNITS = [
  {
    levelWords: 120,
    subtitle: '千里之行，始于足下。',
    subtitleColor: '#2f80ed',
    stageColor: '#1f6fd6',
    doneStages: 2,
    mascot: '../../images/home/mascot-progress.png',
    mascotSprite: '../../images/home/mascot-progress-sprite.png',
    mascotDuration: 2.4,
    locked: false,
    tasks: [
      { type: 'word', label: '单词新学', current: 40, total: 40, percent: 100, color: '#2f80ed', icon: '../../images/home/task-word.png' },
      { type: 'recitation', label: '跟读背诵', current: 24, total: 50, percent: 48, color: '#ff8200', icon: '../../images/home/task-recitation.png' },
      { type: 'listening', label: '听力小测', current: 28, total: 40, percent: 70, color: '#4a90e2', icon: '../../images/home/task-listening.png' }
    ]
  },
  {
    levelWords: 150,
    subtitle: '实践出真知。',
    subtitleColor: '#2f80ed',
    stageColor: '#2f80ed',
    doneStages: 1,
    mascot: '../../images/home/mascot-alert.png',
    mascotSprite: '../../images/home/mascot-alert-sprite.png',
    mascotDuration: 2.4,
    locked: false,
    tasks: [
      { type: 'word', label: '单词新学', current: 50, total: 50, percent: 100, color: '#2f80ed', icon: '../../images/home/task-word.png' },
      { type: 'recitation', label: '跟读背诵', current: 24, total: 50, percent: 48, color: '#ff8200', icon: '../../images/home/task-recitation.png' },
      { type: 'listening', label: '听力小测', current: 0, total: 50, percent: 0, color: '#4a90e2', icon: '../../images/home/task-listening.png' }
    ]
  },
  {
    levelWords: 180,
    subtitle: '积跬步，至千里。',
    subtitleColor: '#777777',
    stageColor: '#777777',
    doneStages: 0,
    mascot: '../../images/home/mascot-sleep.png',
    mascotSprite: '../../images/home/mascot-sleep-sprite.png',
    mascotDuration: 3.2,
    locked: true,
    tasks: [
      { type: 'word', label: '单词新学', current: 0, total: 60, percent: 0, color: '#9a9a9a', icon: '../../images/home/task-word.png' },
      { type: 'recitation', label: '跟读背诵', current: 0, total: 60, percent: 0, color: '#9a9a9a', icon: '../../images/home/task-recitation.png' },
      { type: 'listening', label: '听力小测', current: 0, total: 60, percent: 0, color: '#9a9a9a', icon: '../../images/home/task-listening.png' }
    ]
  }
]

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function getSafeAreaBottom() {
  const systemInfo = wx.getSystemInfoSync()
  if (!systemInfo.safeArea) {
    return 0
  }
  return Math.max(systemInfo.windowHeight - systemInfo.safeArea.bottom, 0)
}

function getHeroLayout() {
  const systemInfo = wx.getSystemInfoSync()
  const windowWidth = Number(systemInfo.windowWidth) || 375
  const statusBarHeight = Number(systemInfo.statusBarHeight) || 20
  let menuBottom = statusBarHeight + 40

  if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
    const menuButton = wx.getMenuButtonBoundingClientRect() || {}
    menuBottom = Number(menuButton.bottom) || menuBottom
  }

  const heroContentTop = Math.ceil((menuBottom + 12) * 750 / windowWidth)
  const bookCardTop = Math.max(heroContentTop + 174, 350)

  return {
    heroContentTop,
    bookCardTop,
    heroSectionHeight: bookCardTop + 290
  }
}

function normalizeBook(book) {
  const result = Object.assign({}, clone(FALLBACK_BOOK), book || {})
  result.bookCover = result.bookCover || FALLBACK_BOOK.bookCover
  result.wordCount = Number(result.wordCount) || FALLBACK_BOOK.wordCount
  result.proverbCount = Number(result.proverbCount) || FALLBACK_BOOK.proverbCount
  result.learningInfo = result.learningInfo || FALLBACK_BOOK.learningInfo
  return result
}

function getLearnedWordCount(book) {
  const learningInfo = book.learningInfo || {}
  const bookProgress = learningInfo.book || {}
  const learned = Number(bookProgress.learningWords || bookProgress.wordCount)
  return Number.isFinite(learned) ? learned : Math.min(1413, book.wordCount)
}

const FALLBACK_LIST_UNITS = markTodayTasks(
  buildListUnits(buildDisplayUnits([], FALLBACK_UNITS)),
  2
)

Page({
  data: {
    loading: true,
    nickName: '',
    canUseUserProfile: false,
    nicknameFocus: false,
    book: normalizeBook(),
    otherBook: {},
    learnedWordCount: 1413,
    progressPercent: 22,
    checkin: {
      continuousDays: 0,
      totalDays: 0,
      todayDone: 0,
      todayGoal: 2
    },
    levelViewMode: 'category',
    selectedMapUnitIndex: -1,
    units: buildDisplayUnits([], FALLBACK_UNITS),
    listUnits: FALLBACK_LIST_UNITS,
    listGroups: groupListUnits(FALLBACK_LIST_UNITS),
    mapTrail: buildMapTrail(buildDisplayUnits([], FALLBACK_UNITS)),
    safeAreaBottom: getSafeAreaBottom(),
    ...getHeroLayout()
  },

  onLoad() {
    this.setData({
      canUseUserProfile: canUseUserProfile()
    })
    this.resetVisibleUnits()
    this.loadHomeData()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    if (this.refresh) {
      this.refresh = false
      this.loadHomeData()
    }
    this.refreshCheckin()
  },

  // 「今日任务」依赖本地进度（完成关卡、保存计划后会变化），每次返回首页都刷新。
  // 顺带按最新的每日目标重算关卡卡片上的「今日」标记（在现有 listUnits 上原地
  // 更新，保留用户切换过的中英字幕状态）。
  refreshCheckin() {
    const resBookId = (this.data.book && this.data.book.resBookId) || ''
    const todayGoal = getDailyGoal(resBookId)
    const listUnits = markTodayTasks(this.data.listUnits, todayGoal)
    this.setData({
      'checkin.todayDone': getTodayDone(resBookId),
      'checkin.todayGoal': todayGoal,
      listUnits,
      listGroups: groupListUnits(listUnits)
    })
  },

  // 构建带「今日」标记的列表关卡：每日目标前 N 个未完成关卡打上标记
  markedListUnits(visibleUnits) {
    const resBookId = (this.data.book && this.data.book.resBookId) || ''
    return markTodayTasks(buildListUnits(visibleUnits), getDailyGoal(resBookId))
  },

  loadHomeData() {
    login().then(result => {
      if (!result || !result.logined) {
        this.setData({ loading: false })
        return
      }
      getUserInfo().then(userInfo => {
        const info = userInfo || {}
        const continuousDays = positiveNumber(info.continuousDays, info.checkInDays, info.signDays)
        this.setData({
          nickName: info.nickName ? info.nickName : '',
          'checkin.continuousDays': continuousDays,
          'checkin.totalDays': countCheckinDates(info) || continuousDays
        })
      })
      return getUserBooks()
    }).then(books => {
      if (!Array.isArray(books) || !books.length) {
        this.setData({ loading: false })
        return
      }

      let selectedBook = books.find(item => item.defaultBook) || books[0]
      let otherBook = books.find(item => item.resBookId !== selectedBook.resBookId) || {}
      selectedBook = normalizeBook(selectedBook)

      this.updateBook(selectedBook, otherBook)
      getApp().globalData.book = selectedBook
      this.loadUnits(selectedBook.resBookId)
    }).catch(error => {
      console.log('[home] load fallback data', error)
      this.setData({ loading: false })
    })
  },

  updateBook(book, otherBook) {
    const learnedWordCount = getLearnedWordCount(book)
    const progressPercent = book.wordCount
      ? Math.min(Math.round(learnedWordCount * 100 / book.wordCount), 100)
      : 0

    this.setData({
      loading: false,
      book,
      otherBook: otherBook || {},
      learnedWordCount,
      progressPercent,
      'checkin.todayDone': getTodayDone(book.resBookId),
      'checkin.todayGoal': getDailyGoal(book.resBookId)
    })
  },

  resetVisibleUnits(apiUnits) {
    const allUnits = buildDisplayUnits(apiUnits, FALLBACK_UNITS)
    const visibleCount = getNextVisibleCount(allUnits.length, 0)

    this.allUnits = allUnits
    this.visibleUnitCount = visibleCount
    const visibleUnits = allUnits.slice(0, visibleCount)
    const listUnits = this.markedListUnits(visibleUnits)
    this.setData({
      units: visibleUnits,
      listUnits,
      listGroups: groupListUnits(listUnits),
      mapTrail: buildMapTrail(visibleUnits),
      selectedMapUnitIndex: -1
    })
  },

  loadMoreUnits() {
    const allUnits = Array.isArray(this.allUnits) ? this.allUnits : []
    const nextVisibleCount = getNextVisibleCount(allUnits.length, this.visibleUnitCount)
    if (nextVisibleCount === this.visibleUnitCount) {
      return
    }

    this.visibleUnitCount = nextVisibleCount
    const visibleUnits = allUnits.slice(0, nextVisibleCount)
    const listUnits = this.markedListUnits(visibleUnits)
    this.setData({
      units: visibleUnits,
      listUnits,
      listGroups: groupListUnits(listUnits),
      mapTrail: buildMapTrail(visibleUnits)
    })
  },

  loadUnits(resBookId) {
    if (!resBookId) {
      return
    }
    getUnits(resBookId).then(data => {
      if (data && Array.isArray(data.list)) {
        this.resetVisibleUnits(data.list)
      }
    })
  },

  switchBook() {
    const otherBook = this.data.otherBook
    if (!otherBook || !otherBook.resBookId) {
      this.showPending()
      return
    }

    toggleBook(otherBook.resBookId).then(() => {
      const currentBook = this.data.book
      const selectedBook = normalizeBook(otherBook)
      this.updateBook(selectedBook, currentBook)
      this.resetVisibleUnits()
      getApp().globalData.book = selectedBook
      this.loadUnits(selectedBook.resBookId)
    })
  },

  getUserProfile() {
    if (!this.data.canUseUserProfile || typeof wx.getUserProfile !== 'function') {
      this.setData({ nicknameFocus: true })
      return
    }

    wx.getUserProfile({
      desc: '展示用户信息',
      success: result => {
        saveUserInfo(result.userInfo).then(userInfo => {
          this.setData({
            nickName: userInfo && userInfo.nickName ? userInfo.nickName : ''
          })
        })
      },
      fail: () => {
        wx.showToast({
          title: '未授权无法获取昵称',
          icon: 'none'
        })
      }
    })
  },

  nickNameChange(event) {
    const nickName = event.detail.value
    this.setData({
      nickName
    })

    if (this.timerId) {
      clearTimeout(this.timerId)
    }

    if (nickName) {
      this.timerId = setTimeout(() => {
        saveUserInfo({ nickName }).then(userInfo => {
          if (userInfo && userInfo.nickName) {
            this.setData({
              nickName: userInfo.nickName
            })
          }
        })
      }, 500)
    }
  },

  nickNameBlur() {
    this.setData({
      nicknameFocus: false
    })
  },

  toggleSubtitleLanguage(event) {
    const unitIndex = Number(event.currentTarget.dataset.unitIndex)
    const units = Array.isArray(this.data.listUnits) ? this.data.listUnits : []
    if (!Number.isInteger(unitIndex) || unitIndex < 0 || unitIndex >= units.length) {
      return
    }

    const nextLanguage = units[unitIndex].subtitleLanguage === 'zh' ? 'en' : 'zh'
    const nextUnits = units.map((unit, index) => (
      index === unitIndex
        ? Object.assign({}, unit, { subtitleLanguage: nextLanguage })
        : unit
    ))

    this.setData({
      listUnits: nextUnits,
      listGroups: groupListUnits(nextUnits)
    })
  },

  handleListTaskTap(event) {
    const unitIndex = Number(event.currentTarget.dataset.unitIndex)
    const units = Array.isArray(this.data.listUnits) ? this.data.listUnits : []
    const unit = units[unitIndex]
    if (!unit) {
      return
    }

    const taskType = event.currentTarget.dataset.taskType
    if (unit.isReview) {
      this.handleReviewTaskTap(unit, taskType)
      return
    }

    if (taskType !== 'word' && taskType !== 'recitation' && taskType !== 'listening') {
      this.showPending()
      return
    }

    if (taskType === 'listening') {
      this.navigateToListeningUnit(unit)
      return
    }

    this.navigateToPracticeUnit(unit, taskType)
  },

  handleReviewTaskTap(unit, taskType) {
    if (unit.locked) {
      wx.showToast({
        title: '完成前面的关卡后解锁复习',
        icon: 'none'
      })
      return
    }

    if (taskType === 'listening') {
      this.navigateToReviewListening(unit)
      return
    }

    this.navigateToReviewPractice(unit, taskType)
  },

  // 复习关卡没有真实 unitId，改用它覆盖的前几关 unitId。带 review=1 让练习/听力页
  // 把内容收敛到这几关里学生做错的词（错词数据待后端接口提供）。
  navigateToReviewPractice(unit, taskType) {
    const book = this.data.book
    const unitIds = Array.isArray(unit.reviewUnitIds) ? unit.reviewUnitIds : []
    if (!book.resBookId || !unitIds.length) {
      this.showPending()
      return
    }

    wx.navigateTo({
      url: '../practice/practice?resBookId=' + book.resBookId +
        '&unitId=' + unitIds[0] +
        '&name=' + encodeURIComponent(book.name) +
        '&taskType=' + (taskType === 'word' ? 'word' : 'recitation') +
        '&review=1' +
        '&reviewUnitIds=' + encodeURIComponent(unitIds.join(','))
    })
  },

  navigateToReviewListening(unit) {
    const book = this.data.book
    const unitIds = Array.isArray(unit.reviewUnitIds) ? unit.reviewUnitIds : []
    if (!book.resBookId || !unitIds.length) {
      this.showPending()
      return
    }

    wx.navigateTo({
      url: '/pages/listen/listen?resBookId=' + book.resBookId +
        '&unitId=' + unitIds[0] +
        '&mode=quiz' +
        '&review=1' +
        '&reviewUnitIds=' + encodeURIComponent(unitIds.join(','))
    })
  },

  switchLevelView(event) {
    const mode = event.currentTarget.dataset.mode
    if ((mode !== 'category' && mode !== 'map') || mode === this.data.levelViewMode) {
      return
    }

    this.setData({
      levelViewMode: mode,
      selectedMapUnitIndex: mode === 'map' ? this.data.selectedMapUnitIndex : -1
    })
  },

  toggleLevelView() {
    const levelViewMode = this.data.levelViewMode === 'category' ? 'map' : 'category'
    this.setData({
      levelViewMode,
      selectedMapUnitIndex: levelViewMode === 'map' ? this.data.selectedMapUnitIndex : -1
    })
  },

  handleMapLevelTap(event) {
    const unitIndex = Number(event.currentTarget.dataset.unitIndex)
    const units = Array.isArray(this.data.units) ? this.data.units : []
    if (!Number.isInteger(unitIndex) || unitIndex < 0 || unitIndex >= units.length) {
      return
    }

    this.setData({
      selectedMapUnitIndex: this.data.selectedMapUnitIndex === unitIndex ? -1 : unitIndex
    })
  },

  handleMapStartTap(event) {
    const unitIndex = Number(event.currentTarget.dataset.unitIndex)
    const units = Array.isArray(this.data.units) ? this.data.units : []
    const unit = units[unitIndex]
    this.navigateToPracticeUnit(unit)
  },

  handleTaskTap(event) {
    const taskType = event.currentTarget.dataset.taskType
    if (taskType !== 'word' && taskType !== 'recitation' && taskType !== 'listening') {
      this.showPending()
      return
    }

    const unitIndex = Number(event.currentTarget.dataset.unitIndex)
    const unit = this.data.units[unitIndex]
    if (taskType === 'listening') {
      this.navigateToListeningUnit(unit)
      return
    }

    this.navigateToPracticeUnit(unit, taskType)
  },

  navigateToListeningUnit(unit) {
    const book = this.data.book
    if (!unit || !unit.unitId || !book.resBookId) {
      this.showPending()
      return
    }

    if (unit.locked) {
      this.showLocked()
      return
    }

    wx.navigateTo({
      url: '/pages/listen/listen?resBookId=' + book.resBookId +
        '&unitId=' + unit.unitId +
        '&mode=quiz'
    })
  },

  navigateToPracticeUnit(unit, taskType) {
    const book = this.data.book
    if (!unit || !unit.unitId || !book.resBookId) {
      this.showPending()
      return
    }

    if (unit.locked) {
      this.showLocked()
      return
    }

    wx.navigateTo({
      url: '../practice/practice?resBookId=' + book.resBookId +
        '&unitId=' + unit.unitId +
        '&name=' + encodeURIComponent(book.name) +
        '&taskType=' + (taskType || 'recitation')
    })
  },

  goStudyPlan() {
    wx.navigateTo({
      url: '../plan/plan?wordCount=' + (this.data.book.wordCount || 0)
    })
  },

  goCheckinCalendar() {
    wx.navigateTo({
      url: '/pages/checkin/calendar'
    })
  },

  showLocked() {
    wx.showToast({
      title: '开通会员后解锁',
      icon: 'none'
    })
  },

  showPending() {
    wx.showToast({
      title: '内容待补充',
      icon: 'none'
    })
  }
})
