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
  UNLOCK_ALL_TASKS_FOR_DEV,
  buildDisplayUnits,
  buildListUnits,
  markTodayTasks,
  groupListUnits,
  buildMapTrail,
  getNextVisibleCount
} = require('./home-units')
const { normalizeCheckedDates, buildDemoCheckedDates, DEMO_CONTINUOUS_DAYS } = require('../checkin/calendar-data')
const { getTodayDone, getDailyGoal } = require('../../utils/checkin-progress')
const { computeScrollTopToCenterTarget } = require('./home-scroll')
const { withTestBook, isDevTestBook } = require('../../utils/dev-books')
const { withMockTextbooks } = require('../../utils/mock-textbooks')
const { IMAGE_BASE_URL } = require('../../utils/image-host')

function isTruthyFlag(value) {
  return value === true || value === 1 || value === '1'
}

function isBookLocked(book) {
  if (!book) {
    return false
  }
  if (book.unlocked !== undefined && book.unlocked !== null && book.unlocked !== '') {
    return !isTruthyFlag(book.unlocked)
  }
  return isTruthyFlag(book.needVip)
}

// 新课标教材：优先看后端显式标记，没有就从名称/简介/版本字段里识别
function isNewStandardBook(book) {
  if (!book) {
    return false
  }
  if (isTruthyFlag(book.newStandard) || isTruthyFlag(book.isNewStandard)) {
    return true
  }
  const text = [book.name, book.intro, book.edition, book.version, book.tags]
    .filter(Boolean)
    .join(' ')
  return text.indexOf('新课标') >= 0
}

function enrichPickerBooks(books) {
  if (!Array.isArray(books)) {
    return []
  }
  return books.map(book => Object.assign({}, book, {
    locked: isBookLocked(book),
    newStandard: isNewStandardBook(book)
  }))
}

// 选教材弹窗：顶部学段切换 + 左侧版本分类栏。
// 「推荐」固定第一项，承接我们接口返回的词书；版本目录先内置占位，
// 词书带 press（出版社/版本）时自动归类，后端补数据后逐步点亮
const PICKER_RECOMMEND_ID = 'recommend'

const PICKER_STAGES = [
  { id: 'primary', name: '小学' },
  { id: 'junior', name: '初中' },
  { id: 'senior', name: '高中' }
]

const PICKER_VERSIONS = {
  primary: ['人教版PEP', '人教精通版', '人教版新起点', '牛津译林版', '外研版一起', '外研版三起', '北师大版', '沪教版'],
  junior: ['人教版', '外研版', '牛津译林版', '仁爱版', '北师大版', '冀教版'],
  senior: ['人教版', '外研版', '牛津译林版', '北师大版']
}

// 词书学段：优先看后端字段，没有就从名称里识别；识别不出的各学段都展示
function getBookStage(book) {
  if (!book) {
    return ''
  }
  const text = [book.stage, book.grades, book.name].filter(Boolean).join(' ')
  if (text.indexOf('小学') >= 0) {
    return 'primary'
  }
  if (text.indexOf('初中') >= 0) {
    return 'junior'
  }
  if (text.indexOf('高中') >= 0) {
    return 'senior'
  }
  return ''
}

function getStageBooks(books, stageId) {
  const list = Array.isArray(books) ? books : []
  return list.filter(book => {
    const stage = getBookStage(book)
    return !stage || stage === stageId
  })
}

function buildPickerCategories(books, stageId) {
  const categories = [{ id: PICKER_RECOMMEND_ID, name: '推荐' }]
  const versions = PICKER_VERSIONS[stageId] || []
  versions.forEach(name => {
    categories.push({ id: name, name })
  })
  // 词书自带的 press 不在内置目录里时也追加成分类，保证每本书都能被找到
  getStageBooks(books, stageId).forEach(book => {
    const press = book && book.press ? String(book.press).trim() : ''
    if (press && !categories.some(item => item.id === press)) {
      categories.push({ id: press, name: press })
    }
  })
  return categories
}

function filterPickerBooks(books, stageId, categoryId) {
  const stageBooks = getStageBooks(books, stageId)
  if (!categoryId || categoryId === PICKER_RECOMMEND_ID) {
    return stageBooks
  }
  return stageBooks.filter(book => book && book.press === categoryId)
}

function hasTodayTaskGroup(listGroups) {
  return (Array.isArray(listGroups) ? listGroups : []).some(group => group.today)
}

function resolveUnitId(unit) {
  if (!unit) {
    return ''
  }
  return unit.unitId || unit.id || ''
}

function getTaskByType(unit, taskType) {
  const tasks = Array.isArray(unit && unit.tasks) ? unit.tasks : []
  return tasks.find(task => task.type === taskType) || null
}

function positiveNumber() {
  for (let i = 0; i < arguments.length; i++) {
    const value = Number(arguments[i])
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }
  return 0
}

function buildBookProgressStyle(progressPercent) {
  const percent = Math.max(0, Math.min(Number(progressPercent) || 0, 100))
  return 'width: ' + percent + '%;'
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

// 演示打卡指标兜底：未登录或接口没有打卡记录时，与打卡日历的演示数据保持一致
function buildDemoCheckinMetrics() {
  return {
    'checkin.continuousDays': DEMO_CONTINUOUS_DAYS,
    'checkin.totalDays': buildDemoCheckedDates(new Date()).length
  }
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
    levelWords: 12,
    subtitle: '千里之行，始于足下。',
    subtitleColor: '#111318',
    stageColor: '#111318',
    doneStages: 3,
    mascot: '../../images/home/mascot-progress.png',
    mascotSprite: '../../images/home/mascot-progress-sprite.png',
    mascotDuration: 2.4,
    locked: false,
    tasks: [
      { type: 'word', label: '单词新学', current: 12, total: 12, percent: 100, color: '#111318', icon: '../../images/home/task-word.png' },
      { type: 'recitation', label: '跟读背诵', current: 12, total: 12, percent: 100, color: '#ff8200', icon: '../../images/home/task-recitation.png' },
      { type: 'listening', label: '关卡小测', current: 12, total: 12, percent: 100, color: '#111318', icon: '../../images/home/task-listening.png' }
    ]
  },
  {
    levelWords: 150,
    subtitle: '实践出真知。',
    subtitleColor: '#111318',
    stageColor: '#111318',
    doneStages: 1,
    mascot: '../../images/home/mascot-alert.png',
    mascotSprite: '../../images/home/mascot-alert-sprite.png',
    mascotDuration: 2.4,
    locked: false,
    tasks: [
      { type: 'word', label: '单词新学', current: 50, total: 50, percent: 100, color: '#111318', icon: '../../images/home/task-word.png' },
      { type: 'recitation', label: '跟读背诵', current: 24, total: 50, percent: 48, color: '#ff8200', icon: '../../images/home/task-recitation.png' },
      { type: 'listening', label: '关卡小测', current: 0, total: 50, percent: 0, color: '#111318', icon: '../../images/home/task-listening.png' }
    ]
  },
  {
    levelWords: 180,
    subtitle: '积跬步，至千里。',
    subtitleColor: '#5c636a',
    stageColor: '#5c636a',
    doneStages: 0,
    mascot: '../../images/home/mascot-sleep.png',
    mascotSprite: '../../images/home/mascot-sleep-sprite.png',
    mascotDuration: 3.2,
    locked: true,
    tasks: [
      { type: 'word', label: '单词新学', current: 0, total: 60, percent: 0, color: '#9a9a9a', icon: '../../images/home/task-word.png' },
      { type: 'recitation', label: '跟读背诵', current: 0, total: 60, percent: 0, color: '#9a9a9a', icon: '../../images/home/task-recitation.png' },
      { type: 'listening', label: '关卡小测', current: 0, total: 60, percent: 0, color: '#9a9a9a', icon: '../../images/home/task-listening.png' }
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

const BOOK_CARD_HEIGHT = 275
const HERO_TITLE_BLOCK_HEIGHT = 101

const TAB_BAR_BODY_RPX = 102

function getHeroLayout() {
  const systemInfo = wx.getSystemInfoSync()
  const windowWidth = Number(systemInfo.windowWidth) || 375
  const windowHeight = Number(systemInfo.windowHeight) || 667
  const statusBarHeight = Number(systemInfo.statusBarHeight) || 20
  let menuBottom = statusBarHeight + 40

  if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
    const menuButton = wx.getMenuButtonBoundingClientRect() || {}
    menuBottom = Number(menuButton.bottom) || menuBottom
  }

  const safeAreaBottom = getSafeAreaBottom()
  const heroContentTop = Math.ceil((menuBottom + 8) * 750 / windowWidth)
  const bookCardTop = heroContentTop + HERO_TITLE_BLOCK_HEIGHT + 40
  const heroSectionHeight = bookCardTop + BOOK_CARD_HEIGHT
  const scrollSpacerRpx = Math.ceil(TAB_BAR_BODY_RPX + 36 + safeAreaBottom * 750 / windowWidth)

  return {
    heroContentTop,
    bookCardTop,
    heroSectionHeight,
    scrollViewHeight: windowHeight,
    scrollSpacerRpx,
    scrollViewStyle: 'height: ' + windowHeight + 'px;',
    heroSectionStyle: 'height: ' + heroSectionHeight + 'rpx;',
    heroCopyStyle: 'top: ' + heroContentTop + 'rpx;',
    bookCardStyle: 'top: ' + bookCardTop + 'rpx;',
    scrollSpacerStyle: 'height: ' + scrollSpacerRpx + 'rpx;'
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
    imageBaseUrl: IMAGE_BASE_URL,
    loading: true,
    nickName: '',
    canUseUserProfile: false,
    nicknameFocus: false,
    book: normalizeBook(),
    otherBook: {},
    learnedWordCount: 1413,
    progressPercent: 22,
    bookProgressStyle: buildBookProgressStyle(22),
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
    bookPickerVisible: false,
    allBooks: [],
    pickerStages: PICKER_STAGES,
    pickerStageId: PICKER_STAGES[0].id,
    pickerCategories: [],
    pickerCategoryId: PICKER_RECOMMEND_ID,
    pickerBooks: [],
    hasTodayTasks: hasTodayTaskGroup(FALLBACK_LIST_UNITS),
    showTodayLocateFab: false,
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
      this.getTabBar().setData({
        selected: 0,
        hidden: !!this.data.bookPickerVisible
      })
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
    const listGroups = groupListUnits(listUnits)
    this.setData({
      'checkin.todayDone': getTodayDone(resBookId),
      'checkin.todayGoal': todayGoal,
      listUnits,
      listGroups,
      hasTodayTasks: hasTodayTaskGroup(listGroups)
    })
    this.updateTodayLocateFab()
  },

  // 构建带「今日」标记的列表关卡：每日目标前 N 个未完成关卡打上标记
  markedListUnits(visibleUnits) {
    const resBookId = (this.data.book && this.data.book.resBookId) || ''
    return markTodayTasks(buildListUnits(visibleUnits), getDailyGoal(resBookId))
  },

  loadHomeData() {
    login().then(result => {
      if (!result || !result.logined) {
        this.setData(Object.assign({ loading: false }, buildDemoCheckinMetrics()))
        return
      }
      getUserInfo().then(userInfo => {
        const info = userInfo || {}
        const continuousDays = positiveNumber(info.continuousDays, info.checkInDays, info.signDays)
        const totalDays = countCheckinDates(info) || continuousDays
        this.setData(Object.assign(
          { nickName: info.nickName ? info.nickName : '' },
          continuousDays || totalDays
            ? { 'checkin.continuousDays': continuousDays, 'checkin.totalDays': totalDays }
            : buildDemoCheckinMetrics()
        ))
      })
      return getUserBooks()
    }).then(books => {
      if (!Array.isArray(books) || !books.length) {
        this.setData({ loading: false })
        return
      }

      books = withMockTextbooks(withTestBook(books))
      let selectedBook = books.find(item => item.defaultBook) || books[0]
      let otherBook = books.find(item => item.resBookId !== selectedBook.resBookId) || {}
      selectedBook = normalizeBook(selectedBook)

      this.setData({ allBooks: enrichPickerBooks(books) })
      this.updateBook(selectedBook, otherBook)
      getApp().globalData.book = selectedBook
      this.loadUnits(selectedBook.resBookId)
    }).catch(error => {
      console.log('[home] load fallback data', error)
      this.setData(Object.assign({ loading: false }, buildDemoCheckinMetrics()))
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
      bookProgressStyle: buildBookProgressStyle(progressPercent),
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
    const listGroups = groupListUnits(listUnits)
    this.setData({
      units: visibleUnits,
      listUnits,
      listGroups,
      hasTodayTasks: hasTodayTaskGroup(listGroups),
      mapTrail: buildMapTrail(visibleUnits),
      selectedMapUnitIndex: -1
    })
    this.updateTodayLocateFab()
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
    const listGroups = groupListUnits(listUnits)
    this.setData({
      units: visibleUnits,
      listUnits,
      listGroups,
      hasTodayTasks: hasTodayTaskGroup(listGroups),
      mapTrail: buildMapTrail(visibleUnits)
    })
    this.updateTodayLocateFab()
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

  setTabBarHidden(hidden) {
    // 已启用 custom tabBar：只通过 custom-tab-bar 的 hidden 控制显隐。
    // wx.showTabBar / wx.hideTabBar 会额外露出 app.json 里 2 项的系统底栏。
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden })
    }
  },

  switchBook() {
    const allBooks = this.data.allBooks
    if (!Array.isArray(allBooks) || allBooks.length < 2) {
      this.showPending()
      return
    }
    // 默认落在当前教材所属学段，找不到就用第一个学段
    const stageId = getBookStage(this.data.book) || PICKER_STAGES[0].id
    this.setData({
      bookPickerVisible: true,
      pickerStageId: stageId,
      pickerCategories: buildPickerCategories(allBooks, stageId),
      pickerCategoryId: PICKER_RECOMMEND_ID,
      pickerBooks: filterPickerBooks(allBooks, stageId, PICKER_RECOMMEND_ID)
    })
    this.setTabBarHidden(true)
  },

  selectBookStage(event) {
    const stageId = event.currentTarget.dataset.stageId
    if (!stageId || stageId === this.data.pickerStageId) {
      return
    }
    this.setData({
      pickerStageId: stageId,
      pickerCategories: buildPickerCategories(this.data.allBooks, stageId),
      pickerCategoryId: PICKER_RECOMMEND_ID,
      pickerBooks: filterPickerBooks(this.data.allBooks, stageId, PICKER_RECOMMEND_ID)
    })
  },

  selectBookCategory(event) {
    const categoryId = event.currentTarget.dataset.categoryId
    if (!categoryId || categoryId === this.data.pickerCategoryId) {
      return
    }
    this.setData({
      pickerCategoryId: categoryId,
      pickerBooks: filterPickerBooks(this.data.allBooks, this.data.pickerStageId, categoryId)
    })
  },

  closeBookPicker() {
    this.setData({ bookPickerVisible: false })
    this.setTabBarHidden(false)
  },

  selectBook(event) {
    const resBookId = event.currentTarget.dataset.resBookId
    const currentBook = this.data.book
    const target = (this.data.allBooks || []).find(item => item.resBookId === resBookId)

    if (!target) {
      return
    }

    // 演示教材只用于预览分类效果，不进入切换/购买流程
    if (target.demo) {
      wx.showToast({
        title: '演示教材，仅供预览',
        icon: 'none'
      })
      return
    }

    if (target.locked) {
      this.setData({ bookPickerVisible: false })
      this.setTabBarHidden(false)
      this.goBuyBook(target)
      return
    }

    this.setData({ bookPickerVisible: false })
    this.setTabBarHidden(false)

    if (!resBookId || resBookId === currentBook.resBookId) {
      return
    }

    if (isDevTestBook(resBookId)) {
      wx.showToast({
        title: '测试词书仅用于演示购买流程',
        icon: 'none'
      })
      return
    }

    toggleBook(resBookId).then(() => {
      const otherBook = (this.data.allBooks || []).find(item => item.resBookId !== resBookId) || {}
      const selectedBook = normalizeBook(target)
      this.updateBook(selectedBook, otherBook)
      this.resetVisibleUnits()
      getApp().globalData.book = selectedBook
      this.loadUnits(selectedBook.resBookId)
    })
  },

  noop() {},

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

    const task = getTaskByType(unit, taskType)
    if (task && task.mapState === 'locked') {
      this.showLocked()
      return
    }
    if (
      !UNLOCK_ALL_TASKS_FOR_DEV &&
      task &&
      task.mapState !== 'active' &&
      task.mapState !== 'completed'
    ) {
      wx.showToast({
        title: '请先完成上一项任务',
        icon: 'none'
      })
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
    const unitId = resolveUnitId(unit)
    if (!unitId || !book.resBookId) {
      this.showPending()
      return
    }

    if (unit.locked) {
      this.showLocked()
      return
    }

    wx.navigateTo({
      url: '/pages/listen/listen?resBookId=' + book.resBookId +
        '&unitId=' + unitId +
        '&mode=quiz'
    })
  },

  navigateToPracticeUnit(unit, taskType) {
    const book = this.data.book
    const unitId = resolveUnitId(unit)
    if (!unitId || !book.resBookId) {
      this.showPending()
      return
    }

    if (unit.locked) {
      this.showLocked()
      return
    }

    wx.navigateTo({
      url: '../practice/practice?resBookId=' + book.resBookId +
        '&unitId=' + unitId +
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

  goUnitReport(event) {
    const unitIndex = Number(event.currentTarget.dataset.unitIndex)
    const units = Array.isArray(this.data.listUnits) ? this.data.listUnits : []
    const unit = units[unitIndex]
    if (!unit || unit.doneStages < 3) {
      return
    }

    const query = [
      'sort=' + (unit.sort || 1),
      'words=' + (unit.levelWords || unit.wordTotal || 12),
      'en=' + encodeURIComponent(unit.subtitleEnglish || ''),
      'zh=' + encodeURIComponent(unit.subtitleChinese || '')
    ].join('&')

    wx.navigateTo({
      url: '/pages/report/report?' + query
    })
  },

  onHomeScroll() {
    this.updateTodayLocateFab()
  },

  updateTodayLocateFab() {
    if (
      this.data.loading ||
      this.data.levelViewMode !== 'category' ||
      !this.data.hasTodayTasks
    ) {
      if (this.data.showTodayLocateFab) {
        this.setData({ showTodayLocateFab: false })
      }
      return
    }

    const query = wx.createSelectorQuery()
    query.select('#today-group').boundingClientRect()
    query.select('.home-scroll').boundingClientRect()
    query.exec(results => {
      const todayRect = results && results[0]
      const scrollRect = results && results[1]
      if (!todayRect || !scrollRect) {
        return
      }

      const showTodayLocateFab = todayRect.bottom < scrollRect.top + 16
      if (showTodayLocateFab !== this.data.showTodayLocateFab) {
        this.setData({ showTodayLocateFab })
      }
    })
  },

  scrollToTodayTasks() {
    if (!this.data.hasTodayTasks) {
      return
    }

    const query = wx.createSelectorQuery()
    query.select('.home-scroll').scrollOffset()
    query.select('#today-scroll-target').boundingClientRect()
    query.select('#today-group').boundingClientRect()
    query.select('.home-scroll').boundingClientRect()
    query.select('.home-scroll').node()
    query.exec(results => {
      const scrollOffset = results && results[0]
      const activeRect = results && results[1]
      const groupRect = results && results[2]
      const scrollRect = results && results[3]
      const scrollNode = results && results[4] && results[4].node
      const targetRect = activeRect && activeRect.height ? activeRect : groupRect

      const targetTop = computeScrollTopToCenterTarget(
        scrollOffset && scrollOffset.scrollTop,
        targetRect,
        scrollRect
      )
      if (targetTop === null || !scrollNode) {
        return
      }

      scrollNode.scrollTo({
        top: targetTop,
        animated: true
      })

      if (this.data.showTodayLocateFab) {
        this.setData({ showTodayLocateFab: false })
      }
    })
  },

  goBuyBook(book) {
    const learningUnits = book.learningInfo && book.learningInfo.book
      ? book.learningInfo.book.learningUnits
      : 0
    const query = [
      'resBookId=' + encodeURIComponent(book.resBookId || ''),
      'name=' + encodeURIComponent(book.name || ''),
      'bookCover=' + encodeURIComponent(book.bookCover || ''),
      'total=' + encodeURIComponent(book.total || learningUnits || 0),
      'wordCount=' + encodeURIComponent(book.wordCount || 0),
      'proverbCount=' + encodeURIComponent(book.proverbCount || 0),
      'press=' + encodeURIComponent(book.press || ''),
      'grades=' + encodeURIComponent(book.grades || book.grade || book.gradeTags || book.applyGrades || book.applicableGrades || ''),
      'intro=' + encodeURIComponent(book.intro || ''),
      'unlocked=' + (book.locked ? '0' : '1')
    ].join('&')

    wx.navigateTo({
      url: '../advertisement/advertisement?' + query
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
