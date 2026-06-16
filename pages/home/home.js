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
const { computeScrollTopToAlignTarget } = require('./home-scroll')
const { withTestBook, applyDevPurchaseToBook, applyDevPurchaseToBooks, isDevPurchased } = require('../../utils/dev-books')
const { getExitLockState } = require('../../utils/exam-data')
const { withMockTextbooks } = require('../../utils/mock-textbooks')
const { IMAGE_BASE_URL } = require('../../utils/image-host')
const { getFallbackBookCover, normalizeBookCover } = require('../../utils/book-cover')
const {
  buildCharacterImageUrls,
  pickGenderFromUserInfo,
  setCharacterGender
} = require('../../utils/character-gender')

function buildExamBannerUrls(imageBaseUrl) {
  const prefix = imageBaseUrl || ''
  const version = '20260615-chatgpt-exit'
  const withVersion = path => `${path}?v=${version}`
  return {
    examEntryBannerUrl: withVersion(prefix + '/images/home/exam-entry-banner-entry.png'),
    examExitBannerUrl: withVersion(prefix + '/images/home/exam-entry-banner-exit.png'),
    examExitLockedBannerUrl: withVersion(prefix + '/images/home/exam-entry-banner-exit-locked.png')
  }
}

function isTruthyFlag(value) {
  return value === true || value === 1 || value === '1'
}

function isBookLocked(book) {
  if (!book) {
    return false
  }
  if (book.resBookId && isDevPurchased(book.resBookId)) {
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
  return books.map(book => {
    const source = book || {}
    return Object.assign({}, source, {
      bookCover: normalizeBookCover(source.bookCover || source.cover),
      locked: isBookLocked(book),
      newStandard: isNewStandardBook(book)
    })
  })
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
  bookCover: getFallbackBookCover(),
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
  // 满屏页高度用 screenHeight：navigationStyle:custom + 自定义 tabBar 下页面满屏，
  // 而真机 windowHeight 会扣掉底栏高度，用它撑 scroll-view 会矮一截。
  const screenHeight = Number(systemInfo.screenHeight) || windowHeight
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
    scrollViewHeight: screenHeight,
    scrollSpacerRpx,
    // 用 screenHeight 撑满整屏：真机 windowHeight 扣了底栏，写死它会让 scroll-view
    // 比满屏的 .home-page 矮一个底栏，底栏上方露出一条页面背景空带（遮挡内容）。
    scrollViewStyle: 'height: ' + screenHeight + 'px;',
    heroSectionStyle: 'height: ' + heroSectionHeight + 'rpx;',
    heroCopyStyle: 'top: ' + heroContentTop + 'rpx;',
    bookCardStyle: 'top: ' + bookCardTop + 'rpx;',
    scrollSpacerStyle: 'height: ' + scrollSpacerRpx + 'rpx;'
  }
}

function normalizeBook(book) {
  const result = applyDevPurchaseToBook(Object.assign({}, clone(FALLBACK_BOOK), book || {}))
  result.bookCover = normalizeBookCover(result.bookCover || result.cover || FALLBACK_BOOK.bookCover)
  result.wordCount = Number(result.wordCount) || FALLBACK_BOOK.wordCount
  result.proverbCount = Number(result.proverbCount) || FALLBACK_BOOK.proverbCount
  result.learningInfo = result.learningInfo || FALLBACK_BOOK.learningInfo
  return result
}

function unlockUnitsForOwnedBook(apiUnits, book) {
  if (!Array.isArray(apiUnits) || isBookLocked(book)) {
    return apiUnits
  }
  return apiUnits.map(unit => Object.assign({}, unit, { needVip: 0 }))
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

// 「再次练习确认」用户勾选「不再提醒」后写入此 key；与报告页共用同一偏好。
const REPRACTICE_SKIP_KEY = 'reprac_skip_confirm'

Page({
  data: {
    imageBaseUrl: IMAGE_BASE_URL,
    ...buildCharacterImageUrls(IMAGE_BASE_URL),
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
    // 入门测 / 结业测入口（插在关卡列表首尾）
    examBookName: '',
    examExitLocked: true,
    examExitLockReason: '',
    showExamExitBanner: false,
    examEntryBannerUrl: '',
    examExitBannerUrl: '',
    examExitLockedBannerUrl: '',
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
    homeIntoView: '',
    monsterHint: {
      visible: false,
      text: ''
    },
    showRepracticePopup: false,
    repracticeLabel: '',
    dontRemindReprac: false,
    ...getHeroLayout()
  },

  onLoad() {
    this.setData({
      canUseUserProfile: canUseUserProfile(),
      ...buildCharacterImageUrls(IMAGE_BASE_URL),
      ...buildExamBannerUrls(IMAGE_BASE_URL)
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
    this.applyCharacterAssets()
    if (this.refresh) {
      this.refresh = false
      this.loadHomeData()
    }
    this.refreshCheckin()
  },

  applyCharacterAssets() {
    this.setData(buildCharacterImageUrls(this.data.imageBaseUrl))
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
        const savedGender = pickGenderFromUserInfo(info)
        if (savedGender) {
          setCharacterGender(savedGender)
          this.applyCharacterAssets()
        }
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

      books = applyDevPurchaseToBooks(withMockTextbooks(withTestBook(books)))
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
    const allUnits = buildDisplayUnits(
      unlockUnitsForOwnedBook(apiUnits, this.data.book),
      FALLBACK_UNITS
    )
    const visibleCount = getNextVisibleCount(allUnits.length, 0)

    this.allUnits = allUnits
    this.visibleUnitCount = visibleCount
    const visibleUnits = allUnits.slice(0, visibleCount)
    const listUnits = this.markedListUnits(visibleUnits)
    const listGroups = groupListUnits(listUnits)
    // 结业测解锁需全部关卡至少 2 星，用完整关卡列表判定
    const exitLock = getExitLockState(allUnits)
    this.setData({
      units: visibleUnits,
      listUnits,
      listGroups,
      hasTodayTasks: hasTodayTaskGroup(listGroups),
      mapTrail: buildMapTrail(visibleUnits),
      selectedMapUnitIndex: -1,
      examBookName: (this.data.book && this.data.book.name) || '',
      examExitLocked: exitLock.locked,
      examExitLockReason: exitLock.reason,
      showExamExitBanner: visibleCount >= allUnits.length
    })
    this.updateTodayLocateFab()
  },

  // 入门测：关卡列表最前面的入口
  goExamEntry() {
    this.openExam('entry')
  },

  // 结业测：关卡列表最后的入口，未解锁时提示
  goExamExit() {
    if (this.data.examExitLocked) {
      wx.showModal({
        title: '结业测未解锁',
        content: this.data.examExitLockReason || '需先通关全部关卡且每关至少 2 星',
        showCancel: false,
        confirmText: '我知道了'
      })
      return
    }
    this.openExam('exit')
  },

  openExam(type) {
    const book = this.data.book || {}
    if (!book.resBookId) {
      wx.showToast({ title: '请先选择教材', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/exam/exam?resBookId=' + encodeURIComponent(book.resBookId) +
        '&type=' + type +
        '&name=' + encodeURIComponent(book.name || '')
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
    const listGroups = groupListUnits(listUnits)
    this.setData({
      units: visibleUnits,
      listUnits,
      listGroups,
      hasTodayTasks: hasTodayTaskGroup(listGroups),
      mapTrail: buildMapTrail(visibleUnits),
      showExamExitBanner: nextVisibleCount >= allUnits.length
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

  // 封面区（卡片上部）：点击进入商品详情页，不区分是否购买
  goBookDetail(event) {
    const resBookId = event.currentTarget.dataset.resBookId
    const target = (this.data.allBooks || []).find(item => item.resBookId === resBookId)

    if (!target) {
      return
    }

    this.goBuyBook(target, () => {
      this.setData({ bookPickerVisible: false })
      this.setTabBarHidden(false)
    })
  },

  // 底部「去购买」：始终按未购买状态打开详情页
  goBuyFromPicker(event) {
    const resBookId = event.currentTarget.dataset.resBookId
    const target = (this.data.allBooks || []).find(item => item.resBookId === resBookId)

    if (!target) {
      return
    }

    this.goBuyBook(Object.assign({}, target, { locked: true }), () => {
      this.setData({ bookPickerVisible: false })
      this.setTabBarHidden(false)
    })
  },

  // 切换横条（卡片底部）：把该教材设为当前。未购买/演示教材切换后由首页据数据上锁提示购买
  switchBookUse(event) {
    const resBookId = event.currentTarget.dataset.resBookId
    const currentBook = this.data.book
    const target = (this.data.allBooks || []).find(item => item.resBookId === resBookId)

    if (!target) {
      return
    }

    this.setData({ bookPickerVisible: false })
    this.setTabBarHidden(false)

    if (!resBookId || resBookId === currentBook.resBookId) {
      return
    }

    const applySwitch = () => {
      const otherBook = (this.data.allBooks || []).find(item => item.resBookId !== resBookId) || {}
      const selectedBook = normalizeBook(target)
      this.updateBook(selectedBook, otherBook)
      this.resetVisibleUnits()
      getApp().globalData.book = selectedBook
      this.loadUnits(selectedBook.resBookId)
    }

    // 演示教材没有真实服务端记录，直接前端切换预览
    if (target.demo) {
      applySwitch()
      return
    }

    toggleBook(resBookId).then(applySwitch)
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
      this.showMonsterHint('请先完成上一项任务')
      return
    }

    // 该环节已完成（已有成绩）→ 先确认再练，除非用户勾过「不再提醒」。
    if (task && task.mapState === 'completed' && !wx.getStorageSync(REPRACTICE_SKIP_KEY)) {
      this._pendingReprac = { unit, taskType }
      this.setData({
        showRepracticePopup: true,
        repracticeLabel: task.label || '这个环节',
        dontRemindReprac: false
      })
      return
    }

    this.runTaskNav(unit, taskType)
  },

  // 实际进入环节练习（听力小测走 listen 页，其余走 practice 页）。
  runTaskNav(unit, taskType) {
    if (taskType === 'listening') {
      this.navigateToListeningUnit(unit)
      return
    }
    this.navigateToPracticeUnit(unit, taskType)
  },

  toggleDontRemind() {
    this.setData({ dontRemindReprac: !this.data.dontRemindReprac })
  },

  // 关闭确认弹窗；勾了「不再提醒」就持久化，无论确认或取消。
  _closeReprac() {
    if (this.data.dontRemindReprac) {
      wx.setStorageSync(REPRACTICE_SKIP_KEY, true)
    }
    this.setData({ showRepracticePopup: false })
  },

  confirmReprac() {
    const pending = this._pendingReprac
    this._closeReprac()
    if (pending) {
      this.runTaskNav(pending.unit, pending.taskType)
    }
    this._pendingReprac = null
  },

  cancelReprac() {
    this._closeReprac()
    this._pendingReprac = null
  },

  handleReviewTaskTap(unit, taskType) {
    if (unit.locked) {
      this.showMonsterHint('完成前面的关卡后解锁复习')
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

  scrollToTop() {
    // 先清空再设回目标，保证每次点击都能触发 scroll-into-view（值不变不会重新滚动）
    this.setData({ homeIntoView: '' }, () => {
      this.setData({ homeIntoView: 'home-top-anchor' })
    })

    if (this.data.showTodayLocateFab) {
      this.setData({ showTodayLocateFab: false })
    }
  },

  scrollToTodayTasks() {
    if (!this.data.hasTodayTasks) {
      return
    }

    const query = wx.createSelectorQuery()
    query.select('.home-scroll').scrollOffset()
    query.select('#today-group').boundingClientRect()
    query.select('.home-scroll').boundingClientRect()
    query.select('.home-scroll').node()
    query.exec(results => {
      const scrollOffset = results && results[0]
      const groupRect = results && results[1]
      const scrollRect = results && results[2]
      const scrollNode = results && results[3] && results[3].node

      const targetTop = computeScrollTopToAlignTarget(
        scrollOffset && scrollOffset.scrollTop,
        groupRect,
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

  goBuyBook(book, onNavigated) {
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
      url: '../advertisement/advertisement?' + query,
      success: () => {
        if (typeof onNavigated === 'function') {
          onNavigated()
        }
      }
    })
  },

  onMainBookCoverError() {
    const fallback = getFallbackBookCover()
    if (this.data.book && this.data.book.bookCover !== fallback) {
      this.setData({ 'book.bookCover': fallback })
    }
  },

  onPickerBookCoverError(event) {
    const resBookId = event.currentTarget.dataset.resBookId
    const fallback = getFallbackBookCover()
    const patchBook = item => item && item.resBookId === resBookId
      ? Object.assign({}, item, { bookCover: fallback })
      : item

    this.setData({
      allBooks: (this.data.allBooks || []).map(patchBook),
      pickerBooks: (this.data.pickerBooks || []).map(patchBook)
    })
  },

  showMonsterHint(text) {
    if (this._monsterHintTimer) {
      clearTimeout(this._monsterHintTimer)
    }
    this.setData({
      monsterHint: {
        visible: true,
        text: text || ''
      }
    })
    this._monsterHintTimer = setTimeout(() => {
      this.setData({ 'monsterHint.visible': false })
      this._monsterHintTimer = null
    }, 2000)
  },

  showLocked() {
    this.showMonsterHint('开通会员后解锁')
  },

  showPending() {
    this.showMonsterHint('内容待补充')
  }
})
