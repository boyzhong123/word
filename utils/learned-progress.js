// 已学口径：关卡内单词新学、跟读背诵、关卡小测三环节均完成，该关单词计入已学。
// 已掌握沿用 level-score-review-spec（掌握度 ≥ 70），不在此模块计算。
const UNIT_TASK_TYPES = ['word', 'recitation', 'listening']

function toNonNegativeInteger(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.floor(parsed)
}

function getBookProgress(book) {
  const learningInfo = (book && book.learningInfo) || {}
  return learningInfo.book || {}
}

function isTaskLearned(task) {
  if (!task) {
    return false
  }
  if (task.mapState === 'completed' || task.stepState === 'completed') {
    return true
  }
  const total = toNonNegativeInteger(task.total)
  const current = toNonNegativeInteger(task.current)
  return total > 0 && current >= total
}

function isUnitLearned(unit) {
  if (!unit || unit.isReview) {
    return false
  }

  const tasks = Array.isArray(unit.tasks) ? unit.tasks : []
  if (tasks.length) {
    return UNIT_TASK_TYPES.every(type => {
      const task = tasks.find(item => item.type === type)
      return isTaskLearned(task)
    })
  }

  if (unit.mapState === 'completed') {
    return true
  }
  return toNonNegativeInteger(unit.doneStages) >= UNIT_TASK_TYPES.length
}

function getUnitWordCount(unit) {
  return toNonNegativeInteger(unit && (unit.levelWords || unit.wordTotal))
}

function countLearnedWordsFromUnits(units) {
  return (Array.isArray(units) ? units : []).reduce((total, unit) => {
    if (!isUnitLearned(unit)) {
      return total
    }
    return total + getUnitWordCount(unit)
  }, 0)
}

function getRegularUnits(units) {
  return (Array.isArray(units) ? units : []).filter(unit => unit && !unit.isReview)
}

function hasCompletedFirstUnit(units) {
  const regularUnits = getRegularUnits(units)
  if (!regularUnits.length) {
    return false
  }
  const firstUnit = regularUnits.find(unit => Number(unit.sort) === 1) || regularUnits[0]
  return isUnitLearned(firstUnit)
}

function hasLearnedBook(book, units) {
  if (Array.isArray(units) && units.length) {
    return hasCompletedFirstUnit(units)
  }
  const progress = getBookProgress(book)
  return toNonNegativeInteger(progress.learningUnits) >= 1
}

function getLearnedWordCount(book, units) {
  if (Array.isArray(units) && units.length) {
    return countLearnedWordsFromUnits(units)
  }
  const progress = getBookProgress(book)
  return toNonNegativeInteger(progress.learningWords)
}

function getLearnedPercent(book, units) {
  const totalWords = toNonNegativeInteger(
    book && (book.wordCount || book.totalWords || getBookProgress(book).totalWords)
  )
  if (!totalWords) {
    return 0
  }
  const learnedWords = getLearnedWordCount(book, units)
  return Math.min(Math.round(learnedWords * 100 / totalWords), 100)
}

function sumLearnedWords(books, unitsByBookId) {
  if (!Array.isArray(books)) {
    return 0
  }
  return books.reduce((total, book) => {
    const resBookId = book && (book.resBookId || book.id)
    const units = unitsByBookId && resBookId ? unitsByBookId[resBookId] : null
    return total + getLearnedWordCount(book, units)
  }, 0)
}

module.exports = {
  UNIT_TASK_TYPES,
  isTaskLearned,
  isUnitLearned,
  countLearnedWordsFromUnits,
  hasCompletedFirstUnit,
  hasLearnedBook,
  getLearnedWordCount,
  getLearnedPercent,
  sumLearnedWords
}
