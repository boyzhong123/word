function toNonNegativeInteger(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.floor(parsed)
}

function findUnitTask(unitsData, unitId, taskType) {
  const list = unitsData && Array.isArray(unitsData.list) ? unitsData.list : []
  const unit = list.find(item => String(item.unitId) === String(unitId))
  if (!unit || !Array.isArray(unit.tasks)) {
    return null
  }
  return unit.tasks.find(task => task.type === taskType) || null
}

// book-units.tasks[].current = 已完成词/题数；再次进入从该下标继续（0-based）。
// 环节已完成时从 0 重练（首页「再练一次」已确认）。
function getTaskResumeIndex(unitsData, unitId, taskType) {
  const task = findUnitTask(unitsData, unitId, taskType)
  if (!task) {
    return 0
  }
  const total = toNonNegativeInteger(task.total)
  const current = toNonNegativeInteger(task.current)
  if (
    task.mapState === 'completed' ||
    task.stepState === 'completed' ||
    toNonNegativeInteger(task.percent) >= 100 ||
    (total > 0 && current >= total)
  ) {
    return 0
  }
  return current
}

function getWordId(item) {
  const word = item && item.word
  return (word && (word.id || word.wordId)) || ''
}

function getWordContent(item) {
  return (item && item.word && item.word.content) || ''
}

function resolveWordMarkStatus(item) {
  if (!item) {
    return 'unknown'
  }
  if (item.mistaken) {
    return 'mistaken'
  }
  if (item.known) {
    return 'known'
  }
  return 'unknown'
}

function computeRecitationItemScore(item) {
  const scores = []
  const pushScore = result => {
    if (result && result.score != null && result.score !== '') {
      scores.push(Number(result.score))
    }
  }
  if (item && item.word) {
    pushScore(item.word.result)
  }
  if (item && Array.isArray(item.proverb)) {
    item.proverb.forEach(proverb => pushScore(proverb && proverb.result))
  }
  if (!scores.length) {
    return null
  }
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

function buildWordMarkPayload(options) {
  const item = options.item
  return {
    unitId: options.unitId || '',
    wordId: getWordId(item),
    word: getWordContent(item),
    taskType: 'word',
    status: resolveWordMarkStatus(item),
    choiceCorrect: !!(item && item.wordChoiceCorrect),
    wordIndex: options.wordIndex,
    timeSpentSeconds: options.timeSpentSeconds,
    resBookId: options.resBookId || ''
  }
}

function buildRecitationScorePayload(options) {
  const item = options.item
  return {
    unitId: options.unitId || '',
    wordId: getWordId(item),
    word: getWordContent(item),
    taskType: 'recitation',
    contentType: 'word',
    score: computeRecitationItemScore(item),
    wordIndex: options.wordIndex,
    durationSeconds: options.durationSeconds,
    resBookId: options.resBookId || ''
  }
}

function shouldReportStep(wordIndex, resumeFrom) {
  return wordIndex >= toNonNegativeInteger(resumeFrom)
}

function submitWordStepProgress(options) {
  if (!options || !options.item || !shouldReportStep(options.wordIndex, options.resumeFrom)) {
    return Promise.resolve(false)
  }
  const payload = buildWordMarkPayload(options)
  if (!payload.unitId) {
    return Promise.resolve(false)
  }
  const { reportWordMark } = require('./api')
  return reportWordMark(payload)
}

function submitRecitationStepProgress(options) {
  if (!options || !options.item || !shouldReportStep(options.wordIndex, options.resumeFrom)) {
    return Promise.resolve(false)
  }
  const payload = buildRecitationScorePayload(options)
  if (!payload.unitId || payload.score == null) {
    return Promise.resolve(false)
  }
  const { reportRecitationScore } = require('./api')
  return reportRecitationScore(payload)
}

module.exports = {
  findUnitTask,
  getTaskResumeIndex,
  resolveWordMarkStatus,
  computeRecitationItemScore,
  buildWordMarkPayload,
  buildRecitationScorePayload,
  submitWordStepProgress,
  submitRecitationStepProgress,
  shouldReportStep
}
