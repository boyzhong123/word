const WEEK_START = 1
const DAY_MS = 24 * 60 * 60 * 1000

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDate(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-')
}

function parseDateKey(value) {
  if (!value) {
    return ''
  }
  if (value instanceof Date) {
    return formatDate(value)
  }
  const text = String(value)
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (!match) {
    return ''
  }
  return [
    match[1],
    pad(match[2]),
    pad(match[3])
  ].join('-')
}

function normalizeCheckedDates(records) {
  if (!Array.isArray(records)) {
    return []
  }
  return records.map(item => {
    if (typeof item === 'string' || item instanceof Date) {
      return parseDateKey(item)
    }
    return parseDateKey(item.date || item.day || item.createdAt || item.checkInDate)
  }).filter(Boolean)
}

function getMonthMeta(targetDate) {
  const year = targetDate.getFullYear()
  const month = targetDate.getMonth()
  const firstDate = new Date(year, month, 1)
  const monthDays = new Date(year, month + 1, 0).getDate()
  const offset = (firstDate.getDay() - WEEK_START + 7) % 7
  const totalCells = Math.ceil((offset + monthDays) / 7) * 7

  return {
    year,
    month,
    monthDays,
    offset,
    totalCells
  }
}

function buildCalendarDays(targetDate, checkedRecords, today) {
  const date = targetDate instanceof Date ? targetDate : new Date()
  const todayKey = formatDate(today instanceof Date ? today : new Date())
  const checkedSet = new Set(normalizeCheckedDates(checkedRecords))
  const meta = getMonthMeta(date)
  const start = new Date(meta.year, meta.month, 1 - meta.offset)
  const days = []

  for (let index = 0; index < meta.totalCells; index++) {
    const current = new Date(start.getTime() + index * DAY_MS)
    const dateKey = formatDate(current)
    const inMonth = current.getMonth() === meta.month
    days.push({
      date: dateKey,
      day: current.getDate(),
      inMonth,
      checked: inMonth && checkedSet.has(dateKey),
      isToday: dateKey === todayKey
    })
  }

  return days
}

function buildCheckinSummary(days) {
  const monthDays = days.filter(day => day.inMonth)
  const checkedDays = monthDays.filter(day => day.checked).length
  const today = days.find(day => day.isToday)

  return {
    monthDays: monthDays.length,
    checkedDays,
    todayChecked: !!(today && today.checked),
    progressPercent: monthDays.length
      ? Math.round(checkedDays * 100 / monthDays.length)
      : 0
  }
}

function buildRecentCheckedDates(count, today) {
  const total = Math.max(0, Math.floor(Number(count) || 0))
  const end = today instanceof Date ? today : new Date()
  const dates = []

  for (let index = 0; index < total; index++) {
    const date = new Date(end.getTime() - index * DAY_MS)
    dates.push(formatDate(date))
  }

  return dates
}

module.exports = {
  buildCalendarDays,
  buildCheckinSummary,
  buildRecentCheckedDates,
  formatDate,
  normalizeCheckedDates
}
