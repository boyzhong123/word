const PENDING_TODAY_FEEDBACK_KEY = 'pendingTodayFeedback'

const TODAY_FEEDBACK = {
  PLAN_UPDATED: 'plan-updated',
  BOOK_CHANGED: 'book-changed'
}

const FEEDBACK_OPTIONS = {
  [TODAY_FEEDBACK.PLAN_UPDATED]: {
    title: '新的学习计划已生成',
    icon: 'none'
  },
  [TODAY_FEEDBACK.BOOK_CHANGED]: {
    title: '新教材学习计划已生成',
    icon: 'none'
  }
}

function queueTodayFeedback(globalData, type) {
  if (!globalData || !FEEDBACK_OPTIONS[type]) {
    return
  }
  globalData[PENDING_TODAY_FEEDBACK_KEY] = type
}

function consumeTodayFeedback(globalData) {
  if (!globalData) {
    return null
  }
  const type = globalData[PENDING_TODAY_FEEDBACK_KEY]
  delete globalData[PENDING_TODAY_FEEDBACK_KEY]
  return FEEDBACK_OPTIONS[type]
    ? Object.assign({}, FEEDBACK_OPTIONS[type])
    : null
}

module.exports = {
  TODAY_FEEDBACK,
  queueTodayFeedback,
  consumeTodayFeedback
}
