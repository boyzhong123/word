// pages/today/today.js
// 「今日」：首访采集 年级/上下学期/教材，之后聚焦展示今日任务（任务式，非列表）。
const { login } = require('../../utils/login')
const { getUserBooks, getUnits, getUserInfo, saveUserInfo } = require('../../utils/api')
const { canUseUserProfile } = require('../../utils/util')
const { IMAGE_BASE_URL, imageUrl } = require('../../utils/image-host')
const {
  buildCharacterImageUrls,
  pickGenderFromUserInfo,
  setCharacterGender
} = require('../../utils/character-gender')
const { withTestBook, applyDevPurchaseToBooks } = require('../../utils/dev-books')
const { withMockTextbooks } = require('../../utils/mock-textbooks')
const { normalizeBookCover, getFallbackBookCover } = require('../../utils/book-cover')
const { isNewStandardBook } = require('../../utils/book-tags')
const { appendReturnTabQuery } = require('../../utils/return-tab')
const { LEVEL_SIZE, getDailyGoal, getTodayDone } = require('../../utils/checkin-progress')
const { getMembership, isMember } = require('../../utils/membership')
const { navigateToVipPurchase, promptVipPurchase } = require('../../utils/vip-purchase')
const { isLevelUnlocked, isFreeLevel } = require('../../utils/level-access')
const {
  getStudentProfile,
  describeProfile
} = require('../../utils/student-profile')
const { redirectToOnboardingIfNeeded } = require('../../utils/onboarding-guard')
const { getLearnedWordCount } = require('../../utils/learned-progress')
const {
  dismissEntryExamPrompt,
  shouldShowEntryExamPrompt
} = require('../../utils/entry-exam-prompt')
const {
  markTodayRouteGuideShown,
  shouldOfferTodayRouteGuide
} = require('../../utils/today-route-guide')
const { getResult } = require('../../utils/exam-data')
const {
  buildDisplayUnits,
  buildListUnits,
  markTodayTasks
} = require('../home/home-units')
const { FALLBACK_UNITS } = require('../../utils/fallback-units')
const { pickActiveBook } = require('../../utils/book-select')

// 今日页演示态：固定展示 3 个关卡，并把当前进度落在第 2 个关卡。已关闭，按真实进度展示。
// 注意 DEMO_ACTIVE_LEVEL_INDEX 在演示开关外也会把「靠前的关卡」强制标成已完成，
// 故一并置 0，避免关闭演示后仍残留「第一关已通关」的假进度。
const DEMO_TODAY_ROUTE = false
const DEMO_TODAY_GOAL = 3
const DEMO_ACTIVE_LEVEL_INDEX = 0
const {
  dismissVipFloatingGuide,
  shouldShowVipFloatingGuide
} = require('../../utils/vip-floating-guide')
const TODAY_SPOT_BUTTON_THEME = 'green'
// 与「成长」页共用同一把「不再提醒」开关：任一处勾过，再练确认弹窗都不再弹。
const REPRACTICE_SKIP_KEY = 'reprac_skip_confirm'
const PRODUCT_HIGHLIGHTS = [
  {
    title: '听单词和例句',
    desc: '原声音频伴读，课前预习和路上磨耳朵都能用',
    icon: '../../images/home/icon-today-feature-listen.png',
    tag: ''
  },
  {
    title: '跟读背诵',
    desc: '开口跟读即时评分，发音问题和背诵效果看得见',
    icon: '../../images/home/icon-today-feature-read.png',
    tag: 'AI打分'
  },
  {
    title: '单词新学',
    desc: '按教材关卡推进新词，单词、释义和例句一起记',
    icon: '../../images/home/icon-today-feature-recite.png',
    tag: ''
  },
  {
    title: '关卡小测',
    desc: '听音填空、背诵评测和错词巩固，学完马上检验',
    icon: '../../images/home/icon-today-feature-quiz.png',
    tag: '错词复习'
  }
]

function pickNumber() {
  for (let i = 0; i < arguments.length; i++) {
    const value = Number(arguments[i])
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }
  return 0
}

function getLearnedWords(book) {
  return getLearnedWordCount(book)
}

function getLearnedSentences(book) {
  const info = (book && book.learningInfo && book.learningInfo.book) || {}
  return pickNumber(
    info.learningSentences,
    info.learnedSentences,
    info.learningProverbs,
    info.learnedProverbs,
    info.sentenceCount,
    book && book.learningSentences,
    book && book.learnedSentences,
    book && book.learningProverbs,
    book && book.learnedProverbs
  )
}

function sumTodayLearning(targetLevels) {
  let words = 0
  let sentences = 0
  ;(targetLevels || []).forEach(level => {
    ;(level.tasks || []).forEach(task => {
      const total = Number(task.total) || Number(level.levelWords) || 0
      const current = Number(task.current) || 0
      const learned = task.stepState === 'completed' ? total : current
      if (task.type === 'word') {
        words += learned
      } else if (task.type === 'recitation') {
        sentences += learned
      }
    })
  })
  return { words, sentences }
}

function getTodayWords(targetLevels, todayDone) {
  const progress = sumTodayLearning(targetLevels)
  if (progress.words > 0) {
    return progress.words
  }
  return Math.max(Number(todayDone) || 0, 0) * LEVEL_SIZE
}

function getTodaySentences(targetLevels) {
  return sumTodayLearning(targetLevels).sentences
}

function getStatusBarHeight() {
  const h = wx.getStorageSync('statusBarHeight')
  return Number(h) || 20
}

function formatUpdateTime(date) {
  const current = date instanceof Date ? date : new Date()
  const month = current.getMonth() + 1
  const day = current.getDate()
  const hours = String(current.getHours()).padStart(2, '0')
  const minutes = String(current.getMinutes()).padStart(2, '0')
  return month + '月' + day + '日 ' + hours + ':' + minutes
}

function normalizeDashboardBook(book) {
  return {
    resBookId: book.resBookId || book.id || '',
    name: book.name || book.bookName || '我的教材',
    press: book.press || book.publisher || book.version || '',
    bookCover: normalizeBookCover(book.bookCover || book.cover || getFallbackBookCover()),
    wordCount: pickNumber(book.wordCount, book.totalWords),
    learnedWords: getLearnedWords(book),
    learnedSentences: getLearnedSentences(book),
    newStandard: isNewStandardBook(book)
  }
}

// spotlight 卡的一句话引导：按子环节类型（普通关 / 错词复习）给出鼓励性提示。
function buildStepHint(unit, task) {
  const total = Number(task.total) || Number(unit.levelWords) || 0
  if (unit.isReview) {
    if (task.type === 'word') {
      return '把之前的错词重新认一遍'
    }
    if (task.type === 'recitation') {
      return '错词再跟读背一遍'
    }
    return '错词听音 + 背诵小测'
  }
  if (task.type === 'word') {
    return '先认 ' + total + ' 个新单词'
  }
  if (task.type === 'recitation') {
    return total + ' 个单词，跟着读一遍'
  }
  return '听音填空 + 背诵评测'
}

// 免费体验关：后端把锁定关卡的子环节都标成了 locked，这里按顺序重算 mapState，
// 让第一个未完成的子环节成为「现在练（active）」，其余为 upcoming，已完成保持 completed。
function activateTasks(rawTasks) {
  let activeAssigned = false
  return (Array.isArray(rawTasks) ? rawTasks : []).map(task => {
    let mapState = 'upcoming'
    if (Number(task.percent) >= 100) {
      mapState = 'completed'
    } else if (!activeAssigned) {
      mapState = 'active'
      activeAssigned = true
    }
    return Object.assign({}, task, { mapState })
  })
}

// 非会员的后续付费关卡只限制进入，不使用锁定视觉：已完成保持 completed，
// 其余环节按 VIP 用户看到的普通 upcoming/active 状态展示。
function presentPaidTasks(rawTasks) {
  return (Array.isArray(rawTasks) ? rawTasks : []).map(task => Object.assign({}, task, {
    mapState: Number(task.percent) >= 100
      ? 'completed'
      : (task.mapState === 'active' ? 'active' : 'upcoming')
  }))
}

function buildDemoRouteTasks(rawTasks, levelIndex) {
  const tasks = Array.isArray(rawTasks) ? rawTasks : []
  if (levelIndex < DEMO_ACTIVE_LEVEL_INDEX) {
    return tasks.map(task => Object.assign({}, task, {
      mapState: 'completed',
      percent: 100
    }))
  }
  if (levelIndex === DEMO_ACTIVE_LEVEL_INDEX) {
    return activateTasks(tasks.map((task, taskIndex) => Object.assign({}, task, {
      percent: taskIndex === 0 ? 0 : Number(task.percent) || 0
    })))
  }
  return tasks.map(task => Object.assign({}, task, {
    mapState: 'upcoming',
    percent: 0
  }))
}

// 关卡左侧的小怪兽形象：按关卡状态取静态图（已通关→插旗、正在闯→对战、下一关→沉睡）。
const LEVEL_MONSTER_BY_STATE = {
  completed: imageUrl('/images/home/map/monsters/jelly-defeated.png'),
  current: imageUrl('/images/home/map/monsters/jelly-fighting.png'),
  upcoming: imageUrl('/images/home/map/monsters/jelly-locked.png'),
  locked: imageUrl('/images/home/map/monsters/jelly-locked.png')
}

// 子环节左侧节点图标：复用成长页的三套环节图标（当前步用 active，其余用 muted）。
const STEP_ICON_BY_TYPE = {
  word: {
    active: '../../images/home/task-word-active.svg',
    muted: '../../images/home/task-word-muted.svg',
    bgActive: '#dcfce7',
    bgMuted: '#edf7f0'
  },
  recitation: {
    active: '../../images/home/task-recitation-active.svg',
    muted: '../../images/home/task-recitation-muted.svg',
    bgActive: '#ffedd5',
    bgMuted: '#fff4e8'
  },
  listening: {
    active: '../../images/home/task-listening-active.svg',
    muted: '../../images/home/task-listening-muted.svg',
    bgActive: '#ededf0',
    bgMuted: '#f3f4f6'
  }
}

function buildStepIcon(task, stepState) {
  const iconSet = STEP_ICON_BY_TYPE[task.type]
  const isActiveStep = stepState === 'active'
  if (!iconSet) {
    return { stepIcon: task.icon || '', stepIconWrapStyle: 'background: #f3f4f6;' }
  }
  return {
    stepIcon: isActiveStep ? iconSet.active : iconSet.muted,
    stepIconWrapStyle: 'background: ' + (isActiveStep ? iconSet.bgActive : iconSet.bgMuted) + ';'
  }
}

// 非当前步骤右侧的状态文案。
function buildStepStatus(stepState) {
  if (stepState === 'completed') {
    return '已完成'
  }
  if (stepState === 'locked') {
    return '会员解锁'
  }
  return '待练'
}

function buildPlanProgressHint(todayDone, todayGoal, allDone) {
  const done = Math.max(Number(todayDone) || 0, 0)
  const goal = Math.max(Number(todayGoal) || 0, 0)
  if (allDone || (goal > 0 && done >= goal)) {
    return '今日计划已完成，明天继续保持'
  }
  if (done > 0) {
    return '已完成 ' + done + '/' + (goal || done) + ' 关，继续按计划推进'
  }
  return '今日计划已准备好，先从第 1 关开始吧'
}

Page({
  data: {
    statusBarHeight: getStatusBarHeight(),
    imageBaseUrl: IMAGE_BASE_URL,
    ...buildCharacterImageUrls(IMAGE_BASE_URL),
    loading: true,

    // hero / 昵称
    nickName: '',
    canUseUserProfile: false,
    nicknameFocus: false,

    // dashboard
    profileText: '',
    greeting: '',
    dateText: '',
    book: null,
    productHighlights: PRODUCT_HIGHLIGHTS,
    highlightsExpanded: false,
    todayWords: 0,
    todaySentences: 0,
    todayGoal: 1,
    todayDone: 0,
    totalSteps: 0,
    doneSteps: 0,
    currentLevelNo: 1,
    stepPercent: 0,
    allDone: false,
    targetLevels: [],
    routeUpdatedAtText: '',
    membership: { active: false },
    showVipFloatingGuide: false,
    routeIconUrl: imageUrl('/images/home/icon-today-route-jelly.png'),
    routeBarWhistleUrl: imageUrl('/images/home/icon-today-route-bar-whistle-jelly.png'),
    routeBarFlagUrl: imageUrl('/images/home/icon-today-route-bar-flag-jelly.png'),
    lockedMonsterUrl: imageUrl('/images/home/map/monsters/jelly-locked.png'),
    spotBtnTheme: TODAY_SPOT_BUTTON_THEME,
    vipFloatingUnlockUrl: imageUrl('/images/home/vip-floating-guide-banner.png'),
    vipNameBadgeUrl: imageUrl('/images/home/vip-name-badge.png'),
    vipNameBadgeInactiveUrl: imageUrl('/images/home/vip-name-badge-inactive.png'),
    showEntryExamPrompt: false,
    entryExamPromptHeroUrl: imageUrl('/images/home/exam-entry-prompt-hero.png'),

    // 再练确认弹窗（点击已完成环节时，先确认再重练；与成长页同一套交互）
    showRepracticePopup: false,
    repracticeLabel: '',
    dontRemindReprac: false,

    // 任务提示气泡（与成长页同款）
    monsterHint: {
      visible: false,
      text: ''
    },

    // 每日提醒：在「开始」按钮上显示手指引导
    todayRouteGuideFingerVisible: false
  },

  onLoad() {
    this._todayReady = false
    this.expandedKeys = {}
    this.setData({
      canUseUserProfile: canUseUserProfile(),
      ...buildCharacterImageUrls(IMAGE_BASE_URL)
    })
  },

  onReady() {
    this._todayReady = true
  },

  onShow() {
    if (redirectToOnboardingIfNeeded()) {
      return
    }
    const globalData = getApp().globalData || {}
    if (globalData.membershipUpdatedAt) {
      this.setData({
        membership: getMembership(),
        showVipFloatingGuide: false
      })
      delete globalData.membershipUpdatedAt
    }
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0, hidden: false })
    }
    this.loadDashboard()
  },

  onHide() {
    if (this.data.todayRouteGuideFingerVisible) {
      this.finishTodayRouteGuide()
    }
  },

  editProfile() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding?edit=1' })
  },

  // ---------------- dashboard ----------------
  loadDashboard() {
    this.applyMeta()
    const globalData = getApp().globalData || {}
    const preferredResBookId = globalData.pendingBookId ||
      (globalData.book && globalData.book.resBookId) ||
      ''
    login().then(result => {
      if (!result || !result.logined) {
        this.setData({ loading: false })
        return null
      }
      this.loadProfile()
      return getUserBooks()
    }).then(books => {
      if (!Array.isArray(books) || !books.length) {
        this.setData({ loading: false })
        return
      }
      const list = applyDevPurchaseToBooks(withMockTextbooks(withTestBook(books)))
      const book = pickActiveBook(list, preferredResBookId)
      if (globalData.pendingBookId) {
        delete globalData.pendingBookId
      }
      if (!book) {
        this.setData({ loading: false })
        return
      }
      const normalized = normalizeDashboardBook(book)
      const prevId = (this.book && this.book.resBookId) ||
        (this.data.book && this.data.book.resBookId) ||
        ''
      if (normalized.resBookId !== prevId) {
        this.expandedKeys = {}
      }
      getApp().globalData.book = Object.assign({}, getApp().globalData.book, normalized)
      this.book = normalized
      this.loadUnits(normalized)
    }).catch(error => {
      console.log('[today] load fallback', error)
      this.setData({ loading: false })
    })
  },

  // 顶部 hero 的昵称与角色（性别）资源；与「成长」页共用同一份用户信息。
  loadProfile() {
    getUserInfo().then(userInfo => {
      const info = userInfo || {}
      const savedGender = pickGenderFromUserInfo(info)
      if (savedGender) {
        setCharacterGender(savedGender)
        this.setData(buildCharacterImageUrls(this.data.imageBaseUrl))
      }
      this.setData({
        nickName: info.nickName ? info.nickName : ''
      })
    }).catch(() => {})
  },

  loadUnits(book) {
    const resBookId = book.resBookId
    const todayGoal = DEMO_TODAY_ROUTE ? DEMO_TODAY_GOAL : getDailyGoal(resBookId)
    const todayDone = DEMO_TODAY_ROUTE ? DEMO_ACTIVE_LEVEL_INDEX : getTodayDone(resBookId)

    getUnits(resBookId).then(data => {
      const apiUnits = data && Array.isArray(data.list) ? data.list : []
      const displayUnits = buildDisplayUnits(apiUnits, FALLBACK_UNITS)
      const listUnits = markTodayTasks(buildListUnits(displayUnits), todayGoal)
      const targets = DEMO_TODAY_ROUTE
        ? listUnits.filter(unit => !unit.isReview).slice(0, DEMO_TODAY_GOAL)
        : listUnits.filter(unit => unit.isTodayTask)
      this.applyTargets(book, targets, todayGoal, todayDone)
    }).catch(() => {
      const displayUnits = buildDisplayUnits([], FALLBACK_UNITS)
      const listUnits = markTodayTasks(buildListUnits(displayUnits), todayGoal)
      const targets = DEMO_TODAY_ROUTE
        ? listUnits.filter(unit => !unit.isReview).slice(0, DEMO_TODAY_GOAL)
        : listUnits.filter(unit => unit.isTodayTask)
      this.applyTargets(book, targets, todayGoal, todayDone)
    })
  },

  applyTargets(book, targets, todayGoal, todayDone) {
    // 把今天要练的每个关卡拆成「单词新学 → 跟读背诵 → 关卡小测」三步，串成一条
    // 自上而下的学习路线：全局只有一个「现在练」的步骤被放大成 spotlight，已完成
    // 收成小勾，后面的变小变灰，营造「学完再学下一个」的一步步任务感。
    let stepCounter = 0
    let doneSteps = 0
    const expandedKeys = this.expandedKeys || (this.expandedKeys = {})
    const routeUpdatedAtText = this.data.routeUpdatedAtText || formatUpdateTime(new Date())
    const targetLevels = targets.map((unit, index) => {
      const key = unit.key || ('lv-' + unit.sort)
      const rawTasks = Array.isArray(unit.tasks) ? unit.tasks : []
      const completed = rawTasks.length > 0 && rawTasks.every(task => Number(task.percent) >= 100)
      const reallyUnlocked = unit.isReview ? !unit.lockedByVip : isLevelUnlocked(unit.sort)
      // 今日计划的第一关作为「免费体验关」：即便未开通会员也始终可练，让免费用户
      // 的今日页永远有一个能开练的当前步骤（其余关卡仍需会员）。会员本就全解锁，
      // 故体验关只在「本应被锁」时生效，不会与会员的全局「现在练」冲突。
      const isFreeTrial = index === 0 && !reallyUnlocked && !completed
      // 展示用：第 1 关本身永久免费，或今日首关的会员体验关，非会员且未完成时标「免费体验」。
      const showFreeTrialBadge = !DEMO_TODAY_ROUTE && !isMember() && !completed && (
        isFreeLevel(unit.sort) || isFreeTrial
      )
      const unlocked = reallyUnlocked || isFreeTrial
      const requiresVip = !unit.isReview && !reallyUnlocked && !isFreeTrial
      // 普通付费关卡只在点击具体环节时拦截，不使用锁定卡样式；
      // 复习关仍保留原有的会员/学习进度锁定语义。
      const locked = unit.isReview ? !unlocked : false
      const cardState = locked ? 'locked' : (completed ? 'completed' : 'active')
      // 非会员后续付费关卡使用普通任务视觉，但不会误标为「现在练」；
      // 复习锁定关卡仍统一按 locked 呈现。
      // 免费体验关：子环节状态由后端下发的 mapState（locked）改为按顺序重算，
      // 让第一个未完成的子环节成为「现在练」。
      let baseTasks
      if (DEMO_TODAY_ROUTE) {
        baseTasks = buildDemoRouteTasks(rawTasks, index)
      } else if (isFreeTrial) {
        baseTasks = activateTasks(rawTasks)
      } else if (requiresVip) {
        baseTasks = presentPaidTasks(rawTasks)
      } else if (locked) {
        baseTasks = rawTasks.map(task => Object.assign({}, task, { mapState: 'locked' }))
      } else {
        baseTasks = rawTasks
      }
      const tasks = baseTasks.map((task, taskIndex) => {
        stepCounter += 1
        const stepState = task.mapState || 'upcoming'
        if (stepState === 'completed') {
          doneSteps += 1
        }
        const total = Number(task.total) || Number(unit.levelWords) || 0
        const current = Number(task.current) || 0
        return Object.assign({}, task, buildStepIcon(task, stepState), {
          stepState,
          isCurrent: stepState === 'active',
          localStepNo: taskIndex + 1,
          stepNo: stepCounter,
          hint: buildStepHint(unit, task),
          statusText: buildStepStatus(stepState),
          progressText: current + '/' + total + (task.type === 'listening' ? ' 题' : ' 词')
        })
      })
      const levelState = locked && !DEMO_TODAY_ROUTE
        ? 'locked'
        : (completed || index < DEMO_ACTIVE_LEVEL_INDEX ? 'completed' : (tasks.some(task => task.isCurrent) ? 'current' : 'upcoming'))
      const levelStatusText = levelState === 'completed'
        ? ('更新于 ' + routeUpdatedAtText)
        : (levelState === 'current' ? '正在闯' : '下一关')

      // 已完成 / 下一关默认折叠成一行，重心压在「正在闯」的当前关；用户可手动展开。
      const totalTaskCount = tasks.length
      const doneTaskCount = tasks.filter(task => task.stepState === 'completed').length
      const collapsible = levelState === 'completed' || levelState === 'upcoming'
      const foldStatusText = levelState === 'completed'
        ? ('更新于 ' + routeUpdatedAtText)
        : ('下一关 · 共 ' + totalTaskCount + ' 步')

      // 已通关的关卡：三星点亮，并放出「报告」入口，与成长页保持一致（今日页只是
      // 成长地图里「今天要做的那几关」，做完同样有星星和闯关报告）。
      const levelCompleted = levelState === 'completed'
      const stageStars = levelCompleted
        ? [true, true, true]
        : (Array.isArray(unit.stageStars) ? unit.stageStars : [false, false, false])
      const showReport = levelCompleted && !unit.isReview

      return {
        key,
        levelNo: index + 1,
        sort: unit.sort,
        unitId: unit.unitId || '',
        isReview: !!unit.isReview,
        title: unit.title || (unit.isReview ? '错词巩固' : ('关卡 ' + unit.sort)),
        subtitle: unit.subtitleChinese || unit.subtitle || '',
        subtitleEnglish: unit.subtitleEnglish || '',
        subtitleChinese: unit.subtitleChinese || '',
        stageStars,
        showReport,
        levelWords: unit.levelWords || 0,
        tasks,
        completed,
        locked: DEMO_TODAY_ROUTE ? false : locked,
        requiresVip: DEMO_TODAY_ROUTE ? false : requiresVip,
        lockedByVip: !!unit.lockedByVip,
        isFreeTrial: DEMO_TODAY_ROUTE ? false : isFreeTrial,
        showFreeTrialBadge: DEMO_TODAY_ROUTE ? false : showFreeTrialBadge,
        cardState,
        levelState,
        levelStatusText,
        markerMonsterUrl: LEVEL_MONSTER_BY_STATE[levelState] || LEVEL_MONSTER_BY_STATE.upcoming,
        collapsible,
        expanded: !!expandedKeys[key],
        totalTaskCount,
        doneTaskCount,
        foldStatusText,
        reviewUnitIds: Array.isArray(unit.reviewUnitIds) ? unit.reviewUnitIds : []
      }
    })

    const totalSteps = stepCounter
    const stepPercent = totalSteps > 0 ? Math.round(doneSteps * 100 / totalSteps) : 0
    const allDone = targetLevels.length > 0 && targetLevels.every(level => level.completed)
    const currentLevel = targetLevels.find(level => level.levelState === 'current') || targetLevels[0] || {}
    const membership = getMembership()
    const showVipFloatingGuide = shouldShowVipFloatingGuide(membership)

    this.setData({
      loading: false,
      book,
      todayWords: getTodayWords(targetLevels, todayDone),
      todaySentences: getTodaySentences(targetLevels),
      todayGoal,
      todayDone,
      totalSteps,
      doneSteps,
      currentLevelNo: currentLevel.levelNo || 1,
      stepPercent,
      allDone,
      targetLevels,
      routeUpdatedAtText,
      membership,
      showVipFloatingGuide
    }, () => {
      this.maybeShowEntryExamPrompt(book)
      this.maybeStartTodayRouteGuide()
    })
  },

  maybeShowEntryExamPrompt(book) {
    const resBookId = book && book.resBookId
    if (!resBookId || this.data.showEntryExamPrompt) {
      return
    }
    const hasEntryResult = !!getResult(resBookId, 'entry')
    if (!shouldShowEntryExamPrompt(resBookId, hasEntryResult)) {
      return
    }
    this.setData({ showEntryExamPrompt: true })
  },

  skipEntryExamPrompt() {
    dismissEntryExamPrompt()
    this.setData({ showEntryExamPrompt: false }, () => {
      this.maybeStartTodayRouteGuide()
    })
  },

  startEntryExam() {
    const book = this.book || this.data.book || {}
    if (!book.resBookId) {
      this.showPending()
      return
    }
    dismissEntryExamPrompt()
    this.setData({ showEntryExamPrompt: false })
    wx.navigateTo({
      url: '/pages/exam/exam?resBookId=' + encodeURIComponent(book.resBookId) +
        '&type=entry' +
        '&name=' + encodeURIComponent(book.name || '')
    })
  },

  applyMeta() {
    const now = new Date()
    const hour = now.getHours()
    let greeting = '晚上好'
    if (hour < 6) {
      greeting = '凌晨好'
    } else if (hour < 11) {
      greeting = '早上好'
    } else if (hour < 14) {
      greeting = '中午好'
    } else if (hour < 18) {
      greeting = '下午好'
    }
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dateText = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + weekdays[now.getDay()]
    this.setData({
      greeting,
      dateText,
      routeUpdatedAtText: formatUpdateTime(now),
      profileText: describeProfile(getStudentProfile())
    })
  },

  // ---------------- nickname (hero) ----------------
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
        wx.showToast({ title: '未授权无法获取昵称', icon: 'none' })
      }
    })
  },

  nickNameChange(event) {
    const nickName = event.detail.value
    this.setData({ nickName })

    if (this.timerId) {
      clearTimeout(this.timerId)
    }

    if (nickName) {
      this.timerId = setTimeout(() => {
        saveUserInfo({ nickName }).then(userInfo => {
          if (userInfo && userInfo.nickName) {
            this.setData({ nickName: userInfo.nickName })
          }
        })
      }, 500)
    }
  },

  nickNameBlur() {
    this.setData({ nicknameFocus: false })
  },

  // ---------------- actions ----------------
  // 折叠/展开某个关卡（已完成、下一关默认折叠成一行）。
  toggleLevel(event) {
    const key = event.currentTarget.dataset.key
    if (!key) {
      return
    }
    this.expandedKeys = this.expandedKeys || {}
    this.expandedKeys[key] = !this.expandedKeys[key]
    const targetLevels = (this.data.targetLevels || []).map(level =>
      level.key === key
        ? Object.assign({}, level, { expanded: !!this.expandedKeys[key] })
        : level
    )
    this.setData({ targetLevels })
  },

  // 点击某个关卡的「子环节」任务卡：会员锁→去开通；未轮到→提示先完成上一项；否则进入练习
  tapTask(event) {
    const key = event.currentTarget.dataset.key
    const taskType = event.currentTarget.dataset.taskType
    const level = (this.data.targetLevels || []).find(item => item.key === key)
    if (!level) {
      return
    }
    if (level.requiresVip && !getMembership().active) {
      promptVipPurchase(this.book || this.data.book)
      return
    }
    // 复习关：非会员一律先弹开通会员确认框，不走「请先完成上一项任务」顺序提示。
    if (level.isReview && !getMembership().active) {
      promptVipPurchase(this.book || this.data.book)
      return
    }
    if (level.locked) {
      // 会员门禁优先：复习被锁多因聚合了付费关卡，非会员先弹「开通会员」确认框；
      // 已是会员才提示先完成前面的关卡。普通关卡锁定一律走开通会员。
      if (level.isReview) {
        if (level.lockedByVip || !getMembership().active) {
          promptVipPurchase(this.book || this.data.book)
        } else {
          this.showMonsterHint('完成前面的关卡后解锁复习')
        }
      } else {
        this.showLocked()
      }
      return
    }

    const task = (level.tasks || []).find(item => item.type === taskType)
    if (!task) {
      return
    }
    if (task.mapState === 'locked') {
      this.showLocked()
      return
    }
    if (task.mapState !== 'active' && task.mapState !== 'completed') {
      this.showMonsterHint('请先完成上一项任务')
      return
    }

    if (this.data.todayRouteGuideFingerVisible && task.isCurrent) {
      this.finishTodayRouteGuide()
    }

    // 已完成的环节：先弹「再练一次」确认（除非勾过不再提醒），与成长页一致。
    if (task.mapState === 'completed' && !wx.getStorageSync(REPRACTICE_SKIP_KEY)) {
      this._pendingReprac = { level, taskType }
      this.setData({
        showRepracticePopup: true,
        repracticeLabel: task.label || '这个环节',
        dontRemindReprac: false
      })
      return
    }

    this.enterLevelStep(level, taskType)
  },

  toggleDontRemind() {
    this.setData({ dontRemindReprac: !this.data.dontRemindReprac })
  },

  // 关闭确认弹窗；勾了「不再提醒」就持久化（与成长页同一把开关）。
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
      this.enterLevelStep(pending.level, pending.taskType)
    }
    this._pendingReprac = null
  },

  cancelReprac() {
    this._closeReprac()
    this._pendingReprac = null
  },

  // 已通关关卡的「报告」入口：跳到闯关报告页，与成长页 goUnitReport 同一目标。
  goLevelReport(event) {
    const key = event.currentTarget.dataset.key
    const level = (this.data.targetLevels || []).find(item => item.key === key)
    if (!level || !level.showReport) {
      return
    }
    const query = [
      'sort=' + (level.sort || level.levelNo || 1),
      'words=' + (level.levelWords || 12),
      'en=' + encodeURIComponent(level.subtitleEnglish || ''),
      'zh=' + encodeURIComponent(level.subtitleChinese || '')
    ].join('&')
    wx.navigateTo({ url: '/pages/report/report?' + query })
  },

  enterLevelStep(level, taskType) {
    const book = this.book || getApp().globalData.book || {}
    if (!book.resBookId) {
      this.showPending()
      return
    }

    if (level.isReview) {
      const unitIds = level.reviewUnitIds || []
      if (!unitIds.length) {
        this.showPending()
        return
      }
      if (taskType === 'listening') {
        wx.navigateTo({
          url: appendReturnTabQuery(
            '/pages/listen/listen?resBookId=' + book.resBookId +
              '&unitId=' + unitIds[0] + '&mode=quiz&review=1&reviewUnitIds=' + encodeURIComponent(unitIds.join(',')),
            'today'
          )
        })
      } else {
        wx.navigateTo({
          url: appendReturnTabQuery(
            '/pages/practice/practice?resBookId=' + book.resBookId +
              '&unitId=' + unitIds[0] +
              '&name=' + encodeURIComponent(book.name) +
              '&taskType=' + (taskType === 'word' ? 'word' : 'recitation') +
              '&review=1&reviewUnitIds=' + encodeURIComponent(unitIds.join(',')),
            'today'
          )
        })
      }
      return
    }

    if (!level.unitId) {
      this.showPending()
      return
    }

    // 免费体验关：带上 trial=1，让练习/随身听放行会员内容门槛。
    const trialParam = level.isFreeTrial ? '&trial=1' : ''
    if (taskType === 'listening') {
      wx.navigateTo({
        url: appendReturnTabQuery(
          '/pages/listen/listen?resBookId=' + book.resBookId +
            '&unitId=' + level.unitId + '&mode=quiz' + trialParam,
          'today'
        )
      })
      return
    }
    wx.navigateTo({
      url: appendReturnTabQuery(
        '/pages/practice/practice?resBookId=' + book.resBookId +
          '&unitId=' + level.unitId +
          '&name=' + encodeURIComponent(book.name) +
          '&taskType=' + (taskType || 'word') + trialParam,
        'today'
      )
    })
  },

  adjustPlan() {
    const book = this.book || getApp().globalData.book || {}
    wx.navigateTo({
      url: '/pages/plan/plan?wordCount=' + (book.wordCount || 0)
    })
  },

  showTodayProgressHint() {
    this.showMonsterHint(buildPlanProgressHint(
      this.data.todayDone,
      this.data.todayGoal,
      this.data.allDone
    ))
  },

  toggleHighlights() {
    this.setData({
      highlightsExpanded: !this.data.highlightsExpanded
    })
  },

  goGrowth() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  // 头部教材胶囊：切换教材的浏览/购买都集中在「成长」页，这里跳过去并自动拉起选择教材弹层。
  switchBook() {
    getApp().globalData.openBookPicker = true
    wx.switchTab({ url: '/pages/home/home' })
  },

  goMembership() {
    navigateToVipPurchase(this.book, { locked: true })
  },

  closeVipFloatingGuide() {
    dismissVipFloatingGuide()
    this.setData({ showVipFloatingGuide: false })
  },

  maybeStartTodayRouteGuide() {
    const book = this.book || this.data.book || {}
    const resBookId = book.resBookId || ''
    if (!shouldOfferTodayRouteGuide({
      targetLevels: this.data.targetLevels,
      allDone: this.data.allDone,
      blocked: this.data.showEntryExamPrompt,
      resBookId
    })) {
      if (this.data.todayRouteGuideFingerVisible) {
        this.setData({ todayRouteGuideFingerVisible: false })
      }
      return
    }
    markTodayRouteGuideShown(resBookId)
    this.setData({ todayRouteGuideFingerVisible: true })
  },

  finishTodayRouteGuide() {
    if (!this.data.todayRouteGuideFingerVisible) {
      return
    }
    this.setData({ todayRouteGuideFingerVisible: false })
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
    promptVipPurchase(this.book || this.data.book)
  },

  showPending() {
    this.showMonsterHint('内容待补充')
  },

  noop() {}
})
