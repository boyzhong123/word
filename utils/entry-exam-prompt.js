// 入门测提示弹窗：按词书、每天最多弹一次。
// 触发条件 = 当前词书无 entry 成绩 且 今天还没给这本书弹过。
// 记录走 mock-store（USE_MOCK=true 落 __mock_state__；接后端时由服务器存/返回）。
const { getSlice, setSlice } = require('./mock/mock-store')

function todayStr() {
  const now = new Date()
  const m = now.getMonth() + 1
  const d = now.getDate()
  return now.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d)
}

function getRecord(resBookId) {
  const all = getSlice('entryExamPrompts') || {}
  return all[resBookId] || null
}

// 今天是否已给这本书弹过
function promptedToday(resBookId) {
  const record = getRecord(resBookId)
  return !!(record && record.lastPromptedDate === todayStr())
}

// 记录「今天已给这本书弹过」（弹窗展示时调用）
function recordEntryExamPrompt(resBookId) {
  if (!resBookId) {
    return
  }
  const all = Object.assign({}, getSlice('entryExamPrompts') || {})
  all[resBookId] = { lastPromptedDate: todayStr() }
  setSlice('entryExamPrompts', all)
}

// 是否应弹：有书 + 无 entry 成绩 + 今天没弹过
function shouldShowEntryExamPrompt(resBookId, hasEntryResult) {
  if (!resBookId || hasEntryResult) {
    return false
  }
  return !promptedToday(resBookId)
}

module.exports = {
  recordEntryExamPrompt,
  shouldShowEntryExamPrompt
}
