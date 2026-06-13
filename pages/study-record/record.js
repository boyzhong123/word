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
const RECORD_ICONS = {
  heroMascot: '../../images/study-record/hero-mascot-home-record-v5.png',
  newWords: '../../images/study-record/icon-detail-new-words-jelly.png',
  practice: '../../images/study-record/icon-stat-practice-jelly.png',
  listen: '../../images/study-record/icon-stat-listen-jelly.png',
  readWord: '../../images/study-record/icon-detail-read-word-jelly.png',
  readSentence: '../../images/study-record/icon-detail-read-sentence-jelly.png',
  quiz: '../../images/study-record/icon-detail-quiz-jelly.png',
  recite: '../../images/study-record/icon-detail-recite-jelly.png',
  review: '../../images/study-record/icon-detail-review-jelly.png',
  trendNew: '../../images/study-record/icon-trend-new-jelly.png',
  trendRead: '../../images/study-record/icon-trend-read-jelly.png',
  trendQuiz: '../../images/study-record/icon-trend-quiz-jelly.png',
  trendRecite: '../../images/study-record/icon-trend-recite-jelly.png'
}
const SUMMARY_ITEMS = [
  { key: 'newWords', label: '单词新学', unit: '词', field: 'newWords', icon: RECORD_ICONS.newWords },
  { key: 'quizWords', label: '关卡小测', unit: '词', field: 'quizWords', icon: RECORD_ICONS.quiz },
  { key: 'listen', label: '随身听', unit: '分钟', field: 'audioMinutes', icon: RECORD_ICONS.listen }
]
const DETAIL_ITEMS = [
  { key: 'newWords', label: '单词新学', unit: '词', field: 'newWords', icon: RECORD_ICONS.newWords },
  { key: 'recitationWords', label: '跟读背诵', unit: '词', field: 'recitationWords', icon: RECORD_ICONS.recite },
  { key: 'quizWords', label: '关卡小测', unit: '词', field: 'quizWords', icon: RECORD_ICONS.quiz },
  { key: 'reviewWords', label: '错词复习', unit: '词', field: 'reviewWords', icon: RECORD_ICONS.review },
  { key: 'audioMinutes', label: '随身听', unit: '分钟', field: 'audioMinutes', icon: RECORD_ICONS.listen },
  { key: 'listenAssess', label: '随身听测评', unit: '次', field: 'listenAssessCount', icon: RECORD_ICONS.practice }
]

function buildClass(base, flags) {
  const classes = base ? [base] : []
  Object.keys(flags || {}).forEach(key => {
    if (flags[key]) {
      classes.push(key)
    }
  })
  return classes.join(' ')
}

function buildHotelRangeClasses(prefix, day) {
  const outer = {}
  const cell = {}
  const band = {}
  let showRangeBand = false
  const bandBase = `${prefix}-range-band`

  if (day.inRange) {
    if (day.isRangeSingle) {
      outer[`${prefix}-single`] = true
      outer[`${prefix}-edge`] = true
      cell[`${prefix}-cell-edge`] = true
    } else {
      showRangeBand = true
      band[bandBase] = true

      if (day.isRangeStart) {
        outer[`${prefix}-edge`] = true
        outer[`${prefix}-start`] = true
        cell[`${prefix}-cell-edge`] = true
        band[`${bandBase}-from-center`] = true
      } else if (day.isRangeEnd) {
        outer[`${prefix}-edge`] = true
        outer[`${prefix}-end`] = true
        cell[`${prefix}-cell-edge`] = true
        band[`${bandBase}-to-center`] = true
      } else {
        outer[`${prefix}-in-range`] = true
        cell[`${prefix}-cell-in-range`] = true
        band[`${bandBase}-full`] = true
      }

      if ((day.isRangeEnd && !day.isWeekStart) || (!day.isRangeStart && !day.isWeekStart)) {
        band[`${bandBase}-round-left`] = true
      }
      if ((day.isRangeStart && !day.isWeekEnd) || (!day.isRangeEnd && !day.isWeekEnd)) {
        band[`${bandBase}-round-right`] = true
      }
    }
  }

  const baseClass = prefix === 'calendar' ? 'calendar-day' : 'recent-day'
  const cellBase = prefix === 'calendar' ? 'calendar-cell-inner' : 'recent-cell-inner'

  return {
    showRangeBand,
    className: buildClass(baseClass, outer),
    cellClassName: buildClass(cellBase, cell),
    bandClassName: buildClass('', band).trim()
  }
}

function formatMonthTitle(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

function buildRangeLabel(day, todayDate) {
  if (day.isRangeSingle) {
    return '当天'
  }
  if (day.isRangeStart) {
    return '开始'
  }
  if (day.isRangeEnd) {
    return '截止'
  }
  if (day.date === todayDate) {
    return '今天'
  }
  return ''
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
    summaryItems: [],
    detailItems: DETAIL_ITEMS,
    heroMascot: RECORD_ICONS.heroMascot,
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
      summary.recitationWords,
      summary.quizWords,
      summary.reviewWords,
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
      summaryItems: SUMMARY_ITEMS.map(item => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        valueText: `${summary[item.field]}${item.unit}`
      })),
      trendRows: [
        this.buildTrendRow('单词新学', summary.newWords, '词', maxTrendValue, 'trend-fill-new', RECORD_ICONS.trendNew),
        this.buildTrendRow('跟读背诵', summary.recitationWords, '词', maxTrendValue, 'trend-fill-read', RECORD_ICONS.trendRead),
        this.buildTrendRow('关卡小测', summary.quizWords, '词', maxTrendValue, 'trend-fill-quiz', RECORD_ICONS.trendQuiz),
        this.buildTrendRow('错词复习', summary.reviewWords, '词', maxTrendValue, 'trend-fill-recite', RECORD_ICONS.trendRecite)
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
    return buildRecentDays(this.today, this.studyRecords, startDate, endDate).map(day => {
      const rangeClasses = buildHotelRangeClasses('recent', day)
      const isEdge = day.isRangeStart || day.isRangeEnd || day.isRangeSingle
      const isToday = day.date === this.todayDate
      let className = `${rangeClasses.className}${!day.hasRecord && !day.inRange ? ' recent-day-empty' : ''}`
      if (isToday && !isEdge) {
        className += ' recent-day-today'
      }
      return Object.assign({}, day, rangeClasses, {
        className,
        cellClassName: rangeClasses.cellClassName || 'recent-cell-inner',
        topLabel: buildRangeLabel(day, this.todayDate)
      })
    })
  },

  buildCalendarDays(startDate, endDate) {
    return buildStudyCalendarDays(this.viewDate, this.studyRecords, startDate, endDate).map(day => {
      const rangeClasses = buildHotelRangeClasses('calendar', day)
      const isEdge = day.isRangeStart || day.isRangeEnd || day.isRangeSingle
      const isToday = day.date === this.todayDate
      const topLabel = day.inMonth ? buildRangeLabel(day, this.todayDate) : ''
      let className = `${rangeClasses.className}${!day.inMonth ? ' calendar-day-blank' : ''}${day.inMonth && day.hasRecord && !day.inRange ? ' calendar-day-has' : ''}`
      if (day.inMonth && isToday && !isEdge) {
        className += ' calendar-day-today'
      }
      return Object.assign({}, day, rangeClasses, {
        className,
        cellClassName: rangeClasses.cellClassName || 'calendar-cell-inner',
        topLabel,
        labelClass: isEdge ? 'calendar-day-label-edge' : (isToday ? 'calendar-day-label-today' : '')
      })
    })
  },

  buildTrendRow(label, value, unit, maxValue, fillClass, icon) {
    const percent = Math.max(6, Math.round((value / maxValue) * 100))
    return {
      label,
      icon,
      valueText: `${value}${unit}`,
      fillClass,
      fillStyle: `width: ${percent}%;`
    }
  },

  buildRangeRecords(records) {
    return records.slice().reverse().map(record => {
      const date = new Date(record.date.replace(/-/g, '/'))
      const expanded = this.expandedRecordDates[record.date] !== false
      const recitationWords = (Number(record.readWords) || 0) + (Number(record.reciteWords) || 0)
      const fields = Object.assign({}, record, { recitationWords })
      return Object.assign({}, record, {
        monthLabel: `${date.getMonth() + 1}月`,
        dayLabel: date.getDate(),
        expanded,
        recitationWords,
        detailItems: DETAIL_ITEMS.map(item => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
          valueText: `${fields[item.field]}${item.unit}`
        })),
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
