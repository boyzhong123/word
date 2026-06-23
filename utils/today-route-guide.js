// 今日页学习路线引导：每天每本书提示一次点「开始」；换书后再提示。
const TODAY_ROUTE_GUIDE_LAST_SHOWN_KEY = 'today-route-guide-last-shown-v1'

function getTodayDateKey(date) {
  const current = date instanceof Date ? date : new Date()
  const year = current.getFullYear()
  const month = String(current.getMonth() + 1).padStart(2, '0')
  const day = String(current.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

function readTodayRouteGuideLastShown() {
  const raw = wx.getStorageSync(TODAY_ROUTE_GUIDE_LAST_SHOWN_KEY)
  if (!raw || typeof raw !== 'object') {
    return { date: '', resBookId: '' }
  }
  return {
    date: String(raw.date || ''),
    resBookId: String(raw.resBookId || '')
  }
}

function markTodayRouteGuideShown(resBookId, date) {
  wx.setStorageSync(TODAY_ROUTE_GUIDE_LAST_SHOWN_KEY, {
    date: getTodayDateKey(date),
    resBookId: String(resBookId || '')
  })
}

function hasShownTodayRouteGuideForBook(resBookId, date) {
  const last = readTodayRouteGuideLastShown()
  const bookId = String(resBookId || '')
  return last.resBookId === bookId && last.date === getTodayDateKey(date)
}

function findCurrentRouteTask(targetLevels) {
  const levels = Array.isArray(targetLevels) ? targetLevels : []
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]
    if (!level || level.locked) {
      continue
    }
    const tasks = Array.isArray(level.tasks) ? level.tasks : []
    for (let j = 0; j < tasks.length; j++) {
      const task = tasks[j]
      if (task && task.isCurrent) {
        return { level, task }
      }
    }
  }
  return null
}

function shouldOfferTodayRouteGuide(options) {
  const opts = options || {}
  const resBookId = String(opts.resBookId || '')
  if (!resBookId || opts.allDone || opts.blocked) {
    return false
  }
  if (!findCurrentRouteTask(opts.targetLevels)) {
    return false
  }
  if (hasShownTodayRouteGuideForBook(resBookId)) {
    return false
  }
  return true
}

module.exports = {
  TODAY_ROUTE_GUIDE_LAST_SHOWN_KEY,
  getTodayDateKey,
  readTodayRouteGuideLastShown,
  markTodayRouteGuideShown,
  hasShownTodayRouteGuideForBook,
  findCurrentRouteTask,
  shouldOfferTodayRouteGuide
}
