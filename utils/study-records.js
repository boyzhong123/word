function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(date) {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }
  const parts = String(date).split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2])
}

function addDays(date, count) {
  const next = parseDate(date)
  next.setDate(next.getDate() + count)
  return next
}

function compareDate(a, b) {
  return parseDate(a).getTime() - parseDate(b).getTime()
}

function normalizeRange(startDate, endDate) {
  return compareDate(startDate, endDate) <= 0
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate }
}

function getDateKeysInRange(startDate, endDate) {
  const range = normalizeRange(startDate, endDate)
  const keys = []
  for (let cursor = parseDate(range.startDate); cursor <= parseDate(range.endDate); cursor = addDays(cursor, 1)) {
    keys.push(formatDate(cursor))
  }
  return keys
}

function buildRecord(date, minutes, newWords, readWords, readSentences, quizWords, reciteWords, reviewWords, audioMinutes, listenAssessCount) {
  return {
    date,
    minutes,
    newWords,
    readWords,
    readSentences,
    quizWords,
    reciteWords,
    reviewWords,
    audioMinutes,
    listenAssessCount
  }
}

function buildDemoStudyRecords(today) {
  const base = parseDate(today)
  const offsets = [
    [-10, 31, 18, 22, 5, 18, 9, 2, 6, 5],
    [-9, 45, 24, 30, 8, 20, 11, 3, 11, 9],
    [-8, 12, 6, 8, 2, 8, 4, 1, 2, 3],
    [-7, 38, 18, 22, 6, 20, 12, 3, 9, 7],
    [-6, 29, 12, 18, 4, 16, 10, 1, 7, 6],
    [-4, 40, 20, 28, 6, 18, 14, 2, 10, 8],
    [-3, 36, 16, 24, 5, 16, 10, 2, 8, 6],
    [-1, 42, 22, 26, 7, 22, 12, 4, 8, 7],
    [0, 33, 14, 20, 5, 14, 8, 2, 7, 5]
  ]

  return offsets.map(item => buildRecord(
    formatDate(addDays(base, item[0])),
    item[1],
    item[2],
    item[3],
    item[4],
    item[5],
    item[6],
    item[7],
    item[8],
    item[9]
  ))
}

function recordMap(records) {
  return (records || []).reduce((map, record) => {
    map[record.date] = record
    return map
  }, {})
}

function getRecordsInRange(records, startDate, endDate) {
  const byDate = recordMap(records)
  return getDateKeysInRange(startDate, endDate)
    .map(date => byDate[date])
    .filter(Boolean)
}

function summarizeStudyRecords(records) {
  const summary = (records || []).reduce((total, record) => {
    total.minutes += Number(record.minutes) || 0
    total.newWords += Number(record.newWords) || 0
    total.readWords += Number(record.readWords) || 0
    total.readSentences += Number(record.readSentences) || 0
    total.quizWords += Number(record.quizWords) || 0
    total.reciteWords += Number(record.reciteWords) || 0
    total.reviewWords += Number(record.reviewWords) || 0
    total.audioMinutes += Number(record.audioMinutes) || 0
    total.listenAssessCount += Number(record.listenAssessCount) || 0
    return total
  }, {
    studyDays: (records || []).length,
    minutes: 0,
    newWords: 0,
    readWords: 0,
    readSentences: 0,
    quizWords: 0,
    reciteWords: 0,
    reviewWords: 0,
    audioMinutes: 0,
    listenAssessCount: 0,
    practiceCount: 0
  })

  summary.practiceCount = summary.readWords + summary.readSentences + summary.quizWords + summary.reciteWords
  summary.recitationWords = summary.readWords + summary.reciteWords
  return summary
}

function buildRangeDayMeta(date, startDate, endDate) {
  const range = normalizeRange(startDate, endDate)
  const inRange = compareDate(date, range.startDate) >= 0 && compareDate(date, range.endDate) <= 0
  if (!inRange) {
    return {
      inRange: false,
      isRangeStart: false,
      isRangeEnd: false,
      isRangeSingle: false,
      isWeekStart: false,
      isWeekEnd: false
    }
  }

  const isRangeStart = date === range.startDate
  const isRangeEnd = date === range.endDate
  const dayOfWeek = parseDate(date).getDay()

  return {
    inRange: true,
    isRangeStart,
    isRangeEnd,
    isRangeSingle: isRangeStart && isRangeEnd,
    isWeekStart: dayOfWeek === 0,
    isWeekEnd: dayOfWeek === 6
  }
}

function buildRecentDays(today, records, startDate, endDate) {
  const byDate = recordMap(records)
  const first = addDays(today, -6)
  return Array.from({ length: 7 }).map((_, index) => {
    const dateObj = addDays(first, index)
    const date = formatDate(dateObj)
    const record = byDate[date]
    return Object.assign({
      date,
      day: dateObj.getDate(),
      weekday: ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()],
      minutes: record ? record.minutes : 0,
      hasRecord: Boolean(record)
    }, buildRangeDayMeta(date, startDate, endDate))
  })
}

function buildStudyCalendarDays(viewDate, records, startDate, endDate) {
  const byDate = recordMap(records)
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const gridStart = addDays(monthStart, -monthStart.getDay())
  const trailing = 6 - monthEnd.getDay()
  const total = monthStart.getDay() + monthEnd.getDate() + trailing

  return Array.from({ length: total }).map((_, index) => {
    const dateObj = addDays(gridStart, index)
    const date = formatDate(dateObj)
    const record = byDate[date]
    return Object.assign({
      date,
      day: dateObj.getDate(),
      inMonth: dateObj.getMonth() === viewDate.getMonth(),
      minutes: record ? record.minutes : 0,
      hasRecord: Boolean(record)
    }, buildRangeDayMeta(date, startDate, endDate))
  })
}

function formatRangeLabel(startDate, endDate) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (startDate === endDate) {
    return `${start.getMonth() + 1}月${start.getDate()}日`
  }
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日 · ${days}天`
}

module.exports = {
  addDays,
  buildDemoStudyRecords,
  buildRangeDayMeta,
  buildRecentDays,
  buildStudyCalendarDays,
  compareDate,
  formatDate,
  formatRangeLabel,
  getDateKeysInRange,
  getRecordsInRange,
  normalizeRange,
  parseDate,
  summarizeStudyRecords
}
