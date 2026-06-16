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
const {
  getExam,
  hasResult,
  saveResult,
  scoreExam
} = require('../../utils/exam-data')

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
  entryExam: '../../images/home/icon-exam-diagnose.svg',
  exitExam: '../../images/home/icon-exam-report.svg',
  trendNew: '../../images/study-record/icon-trend-new-jelly.png',
  trendRead: '../../images/study-record/icon-trend-read-jelly.png',
  trendQuiz: '../../images/study-record/icon-trend-quiz-jelly.png',
  trendRecite: '../../images/study-record/icon-trend-recite-jelly.png'
}
const SUMMARY_ITEMS = [
  { key: 'newWords', label: '单词新学', unit: '词', field: 'newWords', icon: RECORD_ICONS.newWords },
  { key: 'quizQuestions', label: '关卡小测', unit: '题', field: 'quizQuestions', icon: RECORD_ICONS.quiz },
  { key: 'listen', label: '随身听', unit: '分钟', field: 'audioMinutes', icon: RECORD_ICONS.listen }
]
const DETAIL_ITEMS = [
  { key: 'newWords', label: '单词新学', unit: '词', field: 'newWords', icon: RECORD_ICONS.newWords },
  { key: 'recitationWords', label: '跟读背诵', unit: '词', field: 'recitationWords', icon: RECORD_ICONS.recite },
  { key: 'readSentences', label: '跟读背诵', unit: '句', field: 'readSentences', icon: RECORD_ICONS.readSentence },
  { key: 'quizQuestions', label: '关卡小测', unit: '题', field: 'quizQuestions', icon: RECORD_ICONS.quiz },
  { key: 'audioMinutes', label: '随身听', unit: '分钟', field: 'audioMinutes', icon: RECORD_ICONS.listen },
  { key: 'listenAssess', label: '随身听测评', unit: '次', field: 'listenAssessCount', icon: RECORD_ICONS.practice },
  { key: 'entryExam', label: '入门测', unit: '次', field: 'entryExamCount', icon: RECORD_ICONS.entryExam, reportType: 'entry' },
  { key: 'exitExam', label: '结业测', unit: '次', field: 'exitExamCount', icon: RECORD_ICONS.exitExam, reportType: 'exit' }
]
const TREND_ITEMS = [
  { label: '单词新学', unit: '词', field: 'newWords', icon: RECORD_ICONS.trendNew, fillClass: 'trend-fill-new' },
  { label: '背诵词数', unit: '词', field: 'recitationWords', icon: RECORD_ICONS.trendRead, fillClass: 'trend-fill-read' },
  { label: '背诵句数', unit: '句', field: 'readSentences', icon: RECORD_ICONS.trendRecite, fillClass: 'trend-fill-recite' },
  { label: '关卡小测', unit: '题', field: 'quizQuestions', icon: RECORD_ICONS.trendQuiz, fillClass: 'trend-fill-quiz' },
  { label: '随身听', unit: '分钟', field: 'audioMinutes', icon: RECORD_ICONS.listen, fillClass: 'trend-fill-listen' },
  { label: '随身听测评', unit: '次', field: 'listenAssessCount', icon: RECORD_ICONS.practice, fillClass: 'trend-fill-assess' },
  { label: '入门测', unit: '次', field: 'entryExamCount', icon: RECORD_ICONS.entryExam, fillClass: 'trend-fill-entry' },
  { label: '结业测', unit: '次', field: 'exitExamCount', icon: RECORD_ICONS.exitExam, fillClass: 'trend-fill-exit' }
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

  // 选中区间 = 一条连续的浅绿背景带（覆盖区间内每一天，仅在区间首尾/周首尾收圆角）
  if (day.inRange) {
    showRangeBand = true
    band[bandBase] = true
    band[`${bandBase}-full`] = true
    outer[`${prefix}-in-range`] = true
    if (day.isRangeStart || day.isWeekStart) {
      band[`${bandBase}-round-left`] = true
    }
    if (day.isRangeEnd || day.isWeekEnd) {
      band[`${bandBase}-round-right`] = true
    }
  }

  // 深绿块 = 当天学习过（与是否在区间无关），用于清楚区分哪几天学了
  if (day.hasRecord) {
    cell[`${prefix}-cell-studied`] = true
    outer[`${prefix}-studied`] = true
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

function buildPeerBeatText(record, recitationWords, quizQuestions) {
  const effortScore =
    (Number(record.minutes) || 0) * 1.2 +
    (Number(record.newWords) || 0) * 2 +
    recitationWords * 1.4 +
    (Number(record.readSentences) || 0) * 2.5 +
    quizQuestions * 1.1 +
    (Number(record.audioMinutes) || 0) * 0.8 +
    (Number(record.listenAssessCount) || 0) * 3 +
    (Number(record.entryExamCount) || 0) * 8 +
    (Number(record.exitExamCount) || 0) * 8
  const beatPercent = Math.max(55, Math.min(96, 52 + Math.round(Math.sqrt(effortScore) * 2.6)))
  return `击败同期 ${beatPercent}% 学员`
}

function ensureDemoExamResult(type) {
  const examType = type === 'exit' ? 'exit' : 'entry'
  if (hasResult('', examType)) {
    return
  }
  const exam = getExam('', examType)
  const targetRate = examType === 'exit' ? 0.86 : 0.72
  const correctLimit = Math.round(exam.questions.length * targetRate)
  const responses = {}
  exam.questions.forEach((question, index) => {
    if (index < correctLimit) {
      responses[question.id] = question.answer
    }
  })
  saveResult('', examType, scoreExam(exam, responses))
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
      quizQuestions: 0,
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
    hasRangeRecords: false,
    rangePulse: ''
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
    const maxTrendValue = Math.max.apply(null, TREND_ITEMS.map(item => Number(summary[item.field]) || 0).concat(1))

    const rangeKey = `${startDate}~${endDate}`
    let rangePulse = this.data.rangePulse
    if (this._lastRangeKey && this._lastRangeKey !== rangeKey) {
      rangePulse = rangePulse === 'is-refreshed-a' ? 'is-refreshed-b' : 'is-refreshed-a'
    }
    this._lastRangeKey = rangeKey

    this.setData({
      quickRanges: this.buildQuickRanges(),
      monthTitle: formatMonthTitle(this.viewDate),
      rangeLabel: formatRangeLabel(startDate, endDate),
      rangeTag: rangeDays === 1 ? '当天' : `${summary.studyDays}天有记录`,
      rangePulse,
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
      trendRows: TREND_ITEMS.map(item => this.buildTrendRow(
        item.label,
        Number(summary[item.field]) || 0,
        item.unit,
        maxTrendValue,
        item.fillClass,
        item.icon
      )).filter(item => item.value > 0),
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
      if (isToday && !day.hasRecord && !isEdge) {
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
      let className = `${rangeClasses.className}${!day.inMonth ? ' calendar-day-blank' : ''}`
      if (day.inMonth && isToday && !day.hasRecord && !isEdge) {
        className += ' calendar-day-today'
      }
      let labelClass = ''
      if (day.hasRecord) {
        labelClass = 'calendar-day-label-edge'
      } else if (isToday && !isEdge) {
        labelClass = 'calendar-day-label-today'
      }
      return Object.assign({}, day, rangeClasses, {
        className,
        cellClassName: rangeClasses.cellClassName || 'calendar-cell-inner',
        topLabel,
        labelClass
      })
    })
  },

  buildTrendRow(label, value, unit, maxValue, fillClass, icon) {
    const percent = value > 0 ? Math.max(6, Math.round((value / maxValue) * 100)) : 0
    return {
      label,
      icon,
      value,
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
      const quizWords = Number(record.quizWords) || 0
      const quizQuestions = Number(record.quizQuestions) || quizWords * 2
      const fields = Object.assign({}, record, {
        recitationWords,
        quizQuestions,
        entryExamCount: Number(record.entryExamCount) || 0,
        exitExamCount: Number(record.exitExamCount) || 0
      })
      return Object.assign({}, record, {
        monthLabel: `${date.getMonth() + 1}月`,
        dayLabel: date.getDate(),
        expanded,
        recitationWords,
        quizQuestions,
        stageCount: Math.floor(quizQuestions / 2),
        titleText: `完成闯关 ${Math.floor(quizQuestions / 2)} 关 · 学习 ${record.minutes} 分钟`,
        subtitleText: buildPeerBeatText(record, recitationWords, quizQuestions),
        detailItems: DETAIL_ITEMS.map(item => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
          value: Number(fields[item.field]) || 0,
          valueText: `${Number(fields[item.field]) || 0}${item.unit}`,
          canOpenReport: Boolean(item.reportType),
          reportType: item.reportType || '',
          reportUrl: item.reportType ? `/pages/exam/exam-report?type=${item.reportType}` : ''
        })).filter(detail => detail.value > 0),
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
  },

  openDetailReport(event) {
    const url = event.currentTarget.dataset.url
    const type = event.currentTarget.dataset.type
    if (!url || !type) {
      return
    }
    ensureDemoExamResult(type)
    wx.navigateTo({ url })
  }
})
