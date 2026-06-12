const {
  addDays,
  buildDemoStudyRecords,
  buildRecentDays,
  buildStudyCalendarDays,
  formatDate,
  formatRangeLabel,
  getDateKeysInRange,
  getRecordsInRange,
  normalizeRange,
  summarizeStudyRecords
} = require('../../utils/study-records')

const QUICK_RANGES = [
  { id: 'today', label: '今天' },
  { id: 'week', label: '近7天' },
  { id: 'month', label: '本月' },
  { id: 'custom', label: '自定义' }
]
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function buildClass(base, flags) {
  const classes = [base]
  Object.keys(flags || {}).forEach(key => {
    if (flags[key]) {
      classes.push(key)
    }
  })
  return classes.join(' ')
}

function formatMonthTitle(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

function getSafeAreaBottom() {
  const systemInfo = wx.getSystemInfoSync()
  const safeArea = systemInfo.safeArea || {}
  return safeArea.bottom
    ? Math.max(systemInfo.windowHeight - safeArea.bottom, 0)
    : 0
}

Page({
  data: {
    safeAreaBottom: 0,
    quickRanges: [],
    calendarExpanded: false,
    weekdays: WEEKDAYS,
    monthTitle: '',
    rangeLabel: '',
    rangeTag: '当天',
    selectTip: '',
    summary: {
      studyDays: 0,
      minutes: 0,
      newWords: 0,
      practiceCount: 0,
      audioMinutes: 0
    },
    recentDays: [],
    calendarDays: [],
    trendRows: [],
    rangeRecords: [],
    hasRangeRecords: false
  },

  onLoad() {
    this.today = new Date()
    this.todayDate = formatDate(this.today)
    this.viewDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1)
    this.studyRecords = buildDemoStudyRecords(this.today)
    this.expandedRecordDates = {}
    this.selectingRange = false
    this.pendingStartDate = ''
    this.activePresetId = 'today'
    this.setData({ safeAreaBottom: getSafeAreaBottom() })
    this.applyPreset('today')
  },

  applyPreset(id) {
    const today = this.today
    let startDate = this.todayDate
    let endDate = this.todayDate

    if (id === 'week') {
      startDate = formatDate(addDays(today, -6))
    } else if (id === 'month') {
      startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    } else if (id === 'custom') {
      this.selectingRange = true
      this.pendingStartDate = ''
      this.activePresetId = 'custom'
      this.setData({ calendarExpanded: true })
      this.render()
      return
    }

    this.selectingRange = false
    this.pendingStartDate = ''
    this.activePresetId = id
    this.applyRange(startDate, endDate)
  },

  applyRange(startDate, endDate) {
    const range = normalizeRange(startDate, endDate)
    this.rangeStartDate = range.startDate
    this.rangeEndDate = range.endDate
    this.render()
  },

  render() {
    const startDate = this.rangeStartDate || this.todayDate
    const endDate = this.rangeEndDate || this.todayDate
    const rangeRecords = getRecordsInRange(this.studyRecords, startDate, endDate)
    const summary = summarizeStudyRecords(rangeRecords)
    const rangeDays = getDateKeysInRange(startDate, endDate).length
    const maxTrendValue = Math.max(
      summary.newWords,
      summary.readWords + summary.readSentences,
      summary.quizWords,
      summary.reciteWords,
      1
    )

    this.setData({
      quickRanges: this.buildQuickRanges(),
      monthTitle: formatMonthTitle(this.viewDate),
      rangeLabel: formatRangeLabel(startDate, endDate),
      rangeTag: rangeDays === 1 ? '当天' : `${summary.studyDays}天有记录`,
      selectTip: this.buildSelectTip(),
      summary,
      recentDays: this.buildRecentDays(startDate, endDate),
      calendarDays: this.buildCalendarDays(startDate, endDate),
      trendRows: [
        this.buildTrendRow('新学', summary.newWords, '词', maxTrendValue, 'trend-fill-new'),
        this.buildTrendRow('跟读', summary.readWords + summary.readSentences, '次', maxTrendValue, 'trend-fill-read'),
        this.buildTrendRow('小测', summary.quizWords, '词', maxTrendValue, 'trend-fill-quiz'),
        this.buildTrendRow('背诵', summary.reciteWords, '词', maxTrendValue, 'trend-fill-recite')
      ],
      rangeRecords: this.buildRangeRecords(rangeRecords),
      hasRangeRecords: rangeRecords.length > 0
    })
  },

  buildQuickRanges() {
    return QUICK_RANGES.map(item => Object.assign({}, item, {
      active: item.id === this.activePresetId
    }))
  },

  buildSelectTip() {
    if (this.pendingStartDate) {
      return `已选 ${formatRangeLabel(this.pendingStartDate, this.pendingStartDate)} 作为开始日期，再点一个截止日期。`
    }
    if (this.selectingRange) {
      return '像订酒店一样：先点开始日期，再点截止日期。'
    }
    return `当前数据基于 ${formatRangeLabel(this.rangeStartDate || this.todayDate, this.rangeEndDate || this.todayDate)} 统计。`
  },

  buildRecentDays(startDate, endDate) {
    return buildRecentDays(this.today, this.studyRecords, startDate, endDate).map(day => Object.assign({}, day, {
      className: buildClass('recent-day', {
        'recent-day-range': day.inRange,
        'recent-day-edge': day.isRangeStart || day.isRangeEnd,
        'recent-day-empty': !day.hasRecord
      })
    }))
  },

  buildCalendarDays(startDate, endDate) {
    return buildStudyCalendarDays(this.viewDate, this.studyRecords, startDate, endDate).map(day => Object.assign({}, day, {
      className: buildClass('calendar-day', {
        'calendar-day-blank': !day.inMonth,
        'calendar-day-has': day.inMonth && day.hasRecord,
        'calendar-day-range': day.inMonth && day.inRange,
        'calendar-day-edge': day.inMonth && (day.isRangeStart || day.isRangeEnd)
      })
    }))
  },

  buildTrendRow(label, value, unit, maxValue, fillClass) {
    const percent = Math.max(6, Math.round((value / maxValue) * 100))
    return {
      label,
      valueText: `${value}${unit}`,
      fillClass,
      fillStyle: `width: ${percent}%;`
    }
  },

  buildRangeRecords(records) {
    return records.slice().reverse().map(record => {
      const date = new Date(record.date.replace(/-/g, '/'))
      const expanded = this.expandedRecordDates[record.date] !== false
      return Object.assign({}, record, {
        monthLabel: `${date.getMonth() + 1}月`,
        dayLabel: date.getDate(),
        expanded,
        className: buildClass('record-day', {
          'record-day-open': expanded
        })
      })
    })
  },

  selectPreset(event) {
    this.applyPreset(event.currentTarget.dataset.id)
  },

  toggleCalendar() {
    this.setData({ calendarExpanded: !this.data.calendarExpanded })
  },

  prevMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1)
    this.render()
  },

  nextMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1)
    this.render()
  },

  selectRecentDate(event) {
    this.pickDate(event.currentTarget.dataset.date)
  },

  selectCalendarDate(event) {
    const date = event.currentTarget.dataset.date
    const inMonth = event.currentTarget.dataset.inMonth
    if (!date || (inMonth !== true && inMonth !== 'true')) {
      return
    }
    this.pickDate(date)
  },

  pickDate(date) {
    this.activePresetId = 'custom'
    if (!this.selectingRange) {
      this.selectingRange = true
      this.pendingStartDate = date
      this.applyRange(date, date)
      return
    }
    if (!this.pendingStartDate) {
      this.pendingStartDate = date
      this.applyRange(date, date)
      return
    }

    const range = normalizeRange(this.pendingStartDate, date)
    this.selectingRange = false
    this.pendingStartDate = ''
    this.applyRange(range.startDate, range.endDate)
  },

  toggleRecordDay(event) {
    const date = event.currentTarget.dataset.date
    this.expandedRecordDates[date] = !this.expandedRecordDates[date]
    this.render()
  }
})
