// 每个关卡固定的单词数量。固定不变，避免已学单词的关卡划分被打乱。
const LEVEL_SIZE = 10
const INITIAL_LEVEL_COUNT = 5
const WORD_LOAD_BATCH = 8
const DEFAULT_GROUPS = 2
const MIN_GROUPS = 1
const MAX_GROUPS = 8
const { getFallbackBookCover, normalizeBookCover } = require('../../utils/book-cover')
const { getUnits, getUnitResource } = require('../../utils/api')
const { getStudyPlan, saveStudyPlan } = require('../../utils/checkin-progress')
const { TODAY_FEEDBACK, queueTodayFeedback } = require('../../utils/today-feedback')
const {
  PLAN_MASCOT,
  buildPlanMascot,
  buildLevelViewState
} = require('../../utils/plan-preview')

// 预解码三张吉祥物图，避免首次切换组数时现加载导致的首帧跳动
function preloadMascotImages() {
  Object.keys(PLAN_MASCOT).forEach(mood => {
    const src = PLAN_MASCOT[mood].image
    if (src) {
      wx.getImageInfo({ src })
    }
  })
}

function toPositiveInt(value, fallback) {
  const number = Math.floor(Number(value))
  return Number.isFinite(number) && number > 0 ? number : fallback
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getUnitSort(unit, index) {
  const sort = Math.floor(Number(unit && unit.sort))
  return Number.isFinite(sort) && sort > 0 ? sort : index + 1
}

function extractWordNames(resourceList) {
  if (!Array.isArray(resourceList)) {
    return []
  }
  return resourceList
    .map(item => item && item.word && item.word.content)
    .filter(Boolean)
}

function buildInitialWordLoader(levelsExpanded) {
  return (item, index) => {
    if (levelsExpanded) {
      return !!item.unitId && !item.wordsLoaded
    }
    return index < INITIAL_LEVEL_COUNT && !!item.unitId && !item.wordsLoaded
  }
}

function buildFallbackLevelList(totalWords) {
  const total = Math.max(0, Math.floor(totalWords))
  const totalLevels = Math.max(1, Math.ceil(total / LEVEL_SIZE))
  const levelList = []
  for (let i = 0; i < totalLevels; i++) {
    const start = i * LEVEL_SIZE + 1
    const end = Math.min((i + 1) * LEVEL_SIZE, total)
    levelList.push({
      sort: i + 1,
      start,
      end,
      count: end - start + 1,
      wordPreview: '',
      wordsLoading: false,
      wordsLoaded: true
    })
  }
  return levelList
}

function buildLevelListItem(unit, index, words) {
  const sort = getUnitSort(unit, index)
  const count = toPositiveInt(unit.wordTotal, words.length || LEVEL_SIZE)
  return {
    sort,
    unitId: unit.unitId || unit.id || '',
    start: null,
    end: null,
    count: words.length || count,
    wordPreview: words.join(' · '),
    wordsLoading: false,
    wordsLoaded: !!words.length || !unit.unitId
  }
}

function fetchAllLevels(resBookId, totalWords) {
  const fallback = buildFallbackLevelList(totalWords)
  if (!resBookId) {
    return Promise.resolve(fallback)
  }

  return getUnits(resBookId).then(data => {
    const list = data && Array.isArray(data.list) ? data.list.slice() : []
    if (!list.length) {
      return fallback
    }

    list.sort((a, b) => getUnitSort(a, 0) - getUnitSort(b, 0))
    return list.map((unit, index) => buildLevelListItem(unit, index, []))
  }).catch(() => fallback)
}

function enrichLevelWords(resBookId, levelList, shouldLoad) {
  if (!resBookId || !Array.isArray(levelList) || !levelList.length) {
    return Promise.resolve(levelList)
  }

  const tasks = levelList.map((item, index) => {
    if (!shouldLoad(item, index)) {
      return Promise.resolve({ index, item })
    }
    if (!item.unitId || item.wordsLoaded) {
      return Promise.resolve({ index, item })
    }

    const loadingItem = Object.assign({}, item, { wordsLoading: true })
    return getUnitResource(item.unitId).then(resource => {
      const words = extractWordNames(resource)
      return {
        index,
        item: Object.assign({}, loadingItem, {
          count: words.length || item.count,
          wordPreview: words.join(' · '),
          wordsLoading: false,
          wordsLoaded: true
        })
      }
    }).catch(() => ({
      index,
      item: Object.assign({}, loadingItem, {
        wordsLoading: false,
        wordsLoaded: true
      })
    }))
  })

  return Promise.all(tasks).then(results => {
    const next = levelList.slice()
    results.forEach(({ index, item }) => {
      next[index] = item
    })
    return next
  })
}

// 关卡数量由教材总词数决定
function computePlanStats(totalWords, groupsPerDay) {
  const total = Math.max(0, Math.floor(totalWords))
  const groups = Math.max(1, Math.floor(groupsPerDay))
  const totalLevels = Math.max(1, Math.ceil(total / LEVEL_SIZE))
  const estimatedDays = Math.ceil(totalLevels / groups)

  return {
    dailyWords: groups * LEVEL_SIZE,
    totalLevels,
    estimatedDays,
    estimatedWeeks: Math.ceil(estimatedDays / 7),
    planMascot: buildPlanMascot(groups)
  }
}

function buildPresets(maxGroups) {
  return [
    { label: '轻松', value: clamp(1, MIN_GROUPS, maxGroups) },
    { label: '标准', value: clamp(2, MIN_GROUPS, maxGroups) },
    { label: '高效', value: clamp(3, MIN_GROUPS, maxGroups) },
    { label: '冲刺', value: clamp(5, MIN_GROUPS, maxGroups) }
  ]
}

Page({
  data: {
    safeAreaBottom: 0,
    saving: false,
    numBump: '',

    book: { name: '', bookCover: '', wordCount: 0, resBookId: '' },
    levelSize: LEVEL_SIZE,
    groupsPerDay: DEFAULT_GROUPS,
    dailyWords: DEFAULT_GROUPS * LEVEL_SIZE,
    minGroups: MIN_GROUPS,
    maxGroups: MAX_GROUPS,
    presets: [],
    planMascot: buildPlanMascot(DEFAULT_GROUPS),

    totalLevels: 0,
    estimatedDays: 0,
    estimatedWeeks: 0,
    levelList: [],
    displayLevels: [],
    levelsExpanded: false,
    canExpandLevels: false,
    canCollapseLevels: false
  },

  onLoad(options) {
    this.resBookId = ''
    const book = Object.assign(
      { name: '', bookCover: '', wordCount: 0, resBookId: '' },
      (getApp().globalData && getApp().globalData.book) || {}
    )
    book.bookCover = normalizeBookCover(book.bookCover)
    const totalWords = toPositiveInt(options.wordCount, toPositiveInt(book.wordCount, 0))
    book.wordCount = totalWords
    this.resBookId = book.resBookId || ''

    const totalLevels = Math.max(1, Math.ceil(totalWords / LEVEL_SIZE))
    const maxGroups = clamp(MAX_GROUPS, MIN_GROUPS, totalLevels)

    // 读取上次保存的计划（兼容旧数据：旧版保存的是每日词数）
    const saved = getStudyPlan(book.resBookId)
    const savedGroups = saved && (saved.groupsPerDay ||
      (saved.dailyWords ? Math.round(saved.dailyWords / LEVEL_SIZE) : 0))
    const initialGroups = clamp(
      toPositiveInt(savedGroups, DEFAULT_GROUPS),
      MIN_GROUPS,
      maxGroups
    )

    this.setData({
      book,
      groupsPerDay: initialGroups,
      minGroups: MIN_GROUPS,
      maxGroups,
      presets: buildPresets(maxGroups),
      safeAreaBottom: this.getSafeAreaBottom()
    })
    this.refreshPlan(initialGroups)
    preloadMascotImages()
    this.loadAllLevels(this.resBookId, totalWords)
  },

  loadAllLevels(resBookId, totalWords) {
    fetchAllLevels(resBookId, totalWords).then(levelList => {
      this.setData(Object.assign({
        levelList
      }, buildLevelViewState(levelList, false)))
      return enrichLevelWords(
        resBookId,
        levelList,
        buildInitialWordLoader(false)
      )
    }).then(levelList => {
      if (Array.isArray(levelList) && levelList.length) {
        this.setData(Object.assign({
          levelList
        }, buildLevelViewState(levelList, this.data.levelsExpanded)))
      }
    })
  },

  loadPendingLevelWords(fromIndex) {
    const { levelList, levelsExpanded } = this.data
    if (!this.resBookId || !Array.isArray(levelList) || !levelList.length) {
      return
    }

    const pendingIndices = []
    levelList.forEach((item, index) => {
      if (index < fromIndex || !item.unitId || item.wordsLoaded) {
        return
      }
      if (!levelsExpanded && index >= INITIAL_LEVEL_COUNT) {
        return
      }
      pendingIndices.push(index)
    })
    if (!pendingIndices.length) {
      return
    }

    const batchIndices = pendingIndices.slice(0, WORD_LOAD_BATCH)
    const batchSet = new Set(batchIndices)
    enrichLevelWords(this.resBookId, levelList, (item, index) => batchSet.has(index))
      .then(nextList => {
        this.setData(Object.assign({
          levelList: nextList
        }, buildLevelViewState(nextList, this.data.levelsExpanded)))
        if (pendingIndices.length > WORD_LOAD_BATCH) {
          this.loadPendingLevelWords(fromIndex)
        }
      })
  },

  expandLevels() {
    const { levelList } = this.data
    this.setData(Object.assign({
      levelsExpanded: true
    }, buildLevelViewState(levelList, true)))
    this.loadPendingLevelWords(INITIAL_LEVEL_COUNT)
  },

  collapseLevels() {
    const { levelList } = this.data
    this.setData(Object.assign({
      levelsExpanded: false
    }, buildLevelViewState(levelList, false)))
  },

  getSafeAreaBottom() {
    // wx.getWindowInfo 是新版 API，旧基础库回退到 getSystemInfoSync
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    if (!info.safeArea) {
      return 0
    }
    return Math.max(info.windowHeight - info.safeArea.bottom, 0)
  },

  refreshPlan(groupsPerDay) {
    this.setData(computePlanStats(this.data.book.wordCount, groupsPerDay))
  },

  setGroups(value) {
    const next = clamp(toPositiveInt(value, this.data.groupsPerDay), this.data.minGroups, this.data.maxGroups)
    if (next === this.data.groupsPerDay) {
      return false
    }
    // 切换 a/b 两个同效动画类，强制 CSS 跳动动画重新播放
    const nextBump = this.data.numBump === 'num-bump-a' ? 'num-bump-b' : 'num-bump-a'
    // 数值、动画类、计划统计合并进同一次 setData，避免一次点击触发两遍渲染重排
    this.setData(Object.assign(
      { groupsPerDay: next, numBump: nextBump },
      computePlanStats(this.data.book.wordCount, next)
    ))
    return true
  },

  onStep(event) {
    const dir = Number(event.currentTarget.dataset.dir)
    if (this.setGroups(this.data.groupsPerDay + dir) && wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' })
    }
  },

  onPreset(event) {
    this.setGroups(event.currentTarget.dataset.value)
  },

  savePlan() {
    if (this.data.saving) {
      return
    }
    this.setData({ saving: true })

    const { book, groupsPerDay, dailyWords, totalLevels } = this.data
    // 接后端：改调 POST study-plan
    saveStudyPlan(book.resBookId, {
      groupsPerDay,
      levelSize: LEVEL_SIZE,
      dailyWords,
      totalLevels,
      updatedAt: Date.now()
    })

    // 通知首页刷新
    const pages = getCurrentPages()
    const prev = pages[pages.length - 2]
    if (prev) {
      prev.refresh = true
    }

    queueTodayFeedback(getApp().globalData, TODAY_FEEDBACK.PLAN_UPDATED)
    setTimeout(() => {
      wx.navigateBack()
    }, 600)
  },

  onBookCoverError() {
    this.setData({ 'book.bookCover': getFallbackBookCover() })
  }
})
