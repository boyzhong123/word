// 每个关卡固定的单词数量。固定不变，避免已学单词的关卡划分被打乱。
const LEVEL_SIZE = 10
const PREVIEW_COUNT = 5
const DEFAULT_GROUPS = 2
const MIN_GROUPS = 1
const MAX_GROUPS = 8

function toPositiveInt(value, fallback) {
  const number = Math.floor(Number(value))
  return Number.isFinite(number) && number > 0 ? number : fallback
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// 关卡数量由教材总词数决定，固定每关 LEVEL_SIZE 词，与每天练习几组无关。
// 用户只调整每天练习的组数，影响的是预计天数，而不是每关的单词划分。
function computePlan(totalWords, groupsPerDay) {
  const total = Math.max(0, Math.floor(totalWords))
  const groups = Math.max(1, Math.floor(groupsPerDay))
  const totalLevels = Math.max(1, Math.ceil(total / LEVEL_SIZE))
  const estimatedDays = Math.ceil(totalLevels / groups)

  const levelPreview = []
  const previewLength = Math.min(totalLevels, PREVIEW_COUNT)
  for (let i = 0; i < previewLength; i++) {
    const start = i * LEVEL_SIZE + 1
    const end = Math.min((i + 1) * LEVEL_SIZE, total)
    levelPreview.push({
      sort: i + 1,
      start,
      end,
      count: end - start + 1
    })
  }

  return {
    dailyWords: groups * LEVEL_SIZE,
    totalLevels,
    estimatedDays,
    estimatedWeeks: Math.ceil(estimatedDays / 7),
    levelPreview,
    hasMoreLevels: totalLevels > PREVIEW_COUNT
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
    statusBarHeight: wx.getStorageSync('statusBarHeight') || 20,
    navBarHeight: wx.getStorageSync('navigationBarHeight') || 44,
    safeAreaBottom: 0,

    book: { name: '', bookCover: '', wordCount: 0, resBookId: '' },
    levelSize: LEVEL_SIZE,
    groupsPerDay: DEFAULT_GROUPS,
    dailyWords: DEFAULT_GROUPS * LEVEL_SIZE,
    minGroups: MIN_GROUPS,
    maxGroups: MAX_GROUPS,
    presets: [],

    totalLevels: 0,
    estimatedDays: 0,
    estimatedWeeks: 0,
    levelPreview: [],
    hasMoreLevels: false
  },

  onLoad(options) {
    const book = Object.assign(
      { name: '', bookCover: '', wordCount: 0, resBookId: '' },
      (getApp().globalData && getApp().globalData.book) || {}
    )
    const totalWords = toPositiveInt(options.wordCount, toPositiveInt(book.wordCount, 0))
    book.wordCount = totalWords

    const totalLevels = Math.max(1, Math.ceil(totalWords / LEVEL_SIZE))
    const maxGroups = clamp(MAX_GROUPS, MIN_GROUPS, totalLevels)

    // 读取上次保存的计划（兼容旧数据：旧版保存的是每日词数）
    const saved = wx.getStorageSync('studyPlan_' + (book.resBookId || 'default'))
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
  },

  getSafeAreaBottom() {
    const info = wx.getSystemInfoSync()
    if (!info.safeArea) {
      return 0
    }
    return Math.max(info.windowHeight - info.safeArea.bottom, 0)
  },

  refreshPlan(groupsPerDay) {
    this.setData(computePlan(this.data.book.wordCount, groupsPerDay))
  },

  setGroups(value) {
    const next = clamp(toPositiveInt(value, this.data.groupsPerDay), this.data.minGroups, this.data.maxGroups)
    if (next === this.data.groupsPerDay) {
      return
    }
    this.setData({ groupsPerDay: next })
    this.refreshPlan(next)
  },

  onStep(event) {
    const dir = Number(event.currentTarget.dataset.dir)
    this.setGroups(this.data.groupsPerDay + dir)
  },

  onSlide(event) {
    this.setGroups(event.detail.value)
  },

  onPreset(event) {
    this.setGroups(event.currentTarget.dataset.value)
  },

  savePlan() {
    const { book, groupsPerDay, dailyWords, totalLevels } = this.data
    wx.setStorageSync('studyPlan_' + (book.resBookId || 'default'), {
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

    wx.showToast({
      title: '计划已保存',
      icon: 'success'
    })
    setTimeout(() => {
      wx.navigateBack()
    }, 600)
  },

  back() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/home/home' })
    }
  }
})
