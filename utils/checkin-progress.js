// 首页表头「今日任务」所需的进度工具。
// 完成一个关卡时记录当天的 unitId（按天自动重置、按关卡去重），
// 每日目标关卡数来自学习计划，默认 1 关（一天 1 关）。
// 今日打卡进度与学习计划都是后端业务真值（学习记录 / study-plan），前端不持久化：
// 收口到 mock-store 的 dailyProgress / studyPlans slice（按 resBookId 分键）。

const mockStore = require('./mock/mock-store')

const LEVEL_SIZE = 10
const DEFAULT_GROUPS = 1

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

function bookKey(resBookId) {
  return resBookId || 'default'
}

function readDailyRecord(resBookId) {
  const all = mockStore.getSlice('dailyProgress') || {}
  const record = all[bookKey(resBookId)]
  if (record && record.date === todayKey() && Array.isArray(record.units)) {
    return record
  }
  return { date: todayKey(), units: [] }
}

function writeDailyRecord(resBookId, record) {
  const all = Object.assign({}, mockStore.getSlice('dailyProgress'))
  all[bookKey(resBookId)] = record
  mockStore.setSlice('dailyProgress', all)
}

// 今日已完成关卡数（跨天自动归零）
function getTodayDone(resBookId) {
  return readDailyRecord(resBookId).units.length
}

// 今日已完成的关卡 ID（按完成顺序记录，跨天自动归零）
function getTodayDoneUnitIds(resBookId) {
  return readDailyRecord(resBookId).units.slice()
}

// 记录一个关卡完成，返回今日已完成数
function recordLevelDone(resBookId, unitId) {
  const record = readDailyRecord(resBookId)
  const id = String(unitId || '')
  if (id && record.units.indexOf(id) === -1) {
    record.units.push(id)
  }
  // 接后端：关卡完成由 save-learning-record 上报，今日进度从后端读
  writeDailyRecord(resBookId, record)
  return record.units.length
}

// 学习计划（按 resBookId）。接后端：GET/POST study-plan
function getStudyPlan(resBookId) {
  const all = mockStore.getSlice('studyPlans') || {}
  return all[bookKey(resBookId)] || null
}

function saveStudyPlan(resBookId, plan) {
  const all = Object.assign({}, mockStore.getSlice('studyPlans'))
  all[bookKey(resBookId)] = plan
  mockStore.setSlice('studyPlans', all)
  return plan
}

// 每日目标关卡数（来自学习计划，兼容旧版按词数保存的数据）
function getDailyGoal(resBookId) {
  const plan = getStudyPlan(resBookId)
  const groups = plan && (plan.groupsPerDay ||
    (plan.dailyWords ? Math.round(plan.dailyWords / LEVEL_SIZE) : 0))
  const goal = Math.floor(Number(groups))
  return Number.isFinite(goal) && goal > 0 ? goal : DEFAULT_GROUPS
}

module.exports = {
  LEVEL_SIZE,
  getTodayDone,
  getTodayDoneUnitIds,
  recordLevelDone,
  getStudyPlan,
  saveStudyPlan,
  getDailyGoal,
  todayKey
}
