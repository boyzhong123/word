// 新手引导完成后，在「今日」页提示是否进行入门测。
const PENDING_KEY = 'entry_exam_prompt_pending'
const DISMISSED_KEY = 'entry_exam_prompt_dismissed'

function markEntryExamPromptPending() {
  try {
    wx.setStorageSync(PENDING_KEY, true)
  } catch (e) {}
}

function isEntryExamPromptPending() {
  try {
    return !!wx.getStorageSync(PENDING_KEY)
  } catch (e) {
    return false
  }
}

function dismissEntryExamPrompt() {
  try {
    wx.setStorageSync(DISMISSED_KEY, true)
    wx.removeStorageSync(PENDING_KEY)
  } catch (e) {}
}

function shouldShowEntryExamPrompt(resBookId, hasEntryResult) {
  if (!resBookId || !isEntryExamPromptPending()) {
    return false
  }
  try {
    if (wx.getStorageSync(DISMISSED_KEY)) {
      return false
    }
  } catch (e) {}
  return !hasEntryResult
}

module.exports = {
  markEntryExamPromptPending,
  isEntryExamPromptPending,
  dismissEntryExamPrompt,
  shouldShowEntryExamPrompt
}
