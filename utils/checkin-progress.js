// 首页表头「今日任务」所需的本地进度工具。
// 完成一个关卡时记录当天的 unitId（按天自动重置、按关卡去重），
// 每日目标关卡数来自学习计划（studyPlan_<resBookId>），默认 2 关。

const LEVEL_SIZE = 10
const DEFAULT_GROUPS = 2

function pad(value) {
  return String(value).padStart(2, '0')
}

function todayKey(date) {
  const target = date instanceof Date ? date : new Date()
  return [
    target.getFullYear(),
    pad(target.getMonth() + 1),
    pad(target.getDate())
  ].join('-')
}

function dailyKey(resBookId) {
  return 'dailyProgress_' + (resBookId || 'default')
}

function planKey(resBookId) {
  return 'studyPlan_' + (resBookId || 'default')
}

function readDailyRecord(resBookId) {
  const record = wx.getStorageSync(dailyKey(resBookId))
  if (record && record.date === todayKey() && Array.isArray(record.units)) {
    return record
  }
  return { date: todayKey(), units: [] }
}

// 今日已完成关卡数（跨天自动归零）
function getTodayDone(resBookId) {
  return readDailyRecord(resBookId).units.length
}

// 记录一个关卡完成，返回今日已完成数
function recordLevelDone(resBookId, unitId) {
  const record = readDailyRecord(resBookId)
  const id = String(unitId || '')
  if (id && record.units.indexOf(id) === -1) {
    record.units.push(id)
  }
  wx.setStorageSync(dailyKey(resBookId), record)
  return record.units.length
}

// 每日目标关卡数（来自学习计划，兼容旧版按词数保存的数据）
function getDailyGoal(resBookId) {
  const plan = wx.getStorageSync(planKey(resBookId))
  const groups = plan && (plan.groupsPerDay ||
    (plan.dailyWords ? Math.round(plan.dailyWords / LEVEL_SIZE) : 0))
  const goal = Math.floor(Number(groups))
  return Number.isFinite(goal) && goal > 0 ? goal : DEFAULT_GROUPS
}

module.exports = {
  getTodayDone,
  recordLevelDone,
  getDailyGoal,
  todayKey
}
