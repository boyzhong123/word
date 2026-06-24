const test = require('node:test')
const assert = require('node:assert/strict')
const {
  isTaskLearned,
  isUnitLearned,
  countLearnedWordsFromUnits,
  hasCompletedFirstUnit,
  hasLearnedBook,
  getLearnedWordCount,
  getLearnedPercent
} = require('../utils/learned-progress')

function buildTask(type, current, total, mapState) {
  return { type, current, total, mapState }
}

function buildUnit(sort, levelWords, tasks, extra) {
  return Object.assign({
    sort,
    levelWords,
    tasks
  }, extra || {})
}

test('isTaskLearned treats a finished task as learned', () => {
  assert.equal(isTaskLearned(buildTask('word', 12, 12)), true)
  assert.equal(isTaskLearned(buildTask('word', 5, 12)), false)
  assert.equal(isTaskLearned(buildTask('word', 0, 12, 'completed')), true)
})

test('isUnitLearned requires all three stages to finish', () => {
  const partial = buildUnit(1, 12, [
    buildTask('word', 12, 12, 'completed'),
    buildTask('recitation', 12, 12, 'completed'),
    buildTask('listening', 4, 12)
  ])
  const complete = buildUnit(1, 12, [
    buildTask('word', 12, 12, 'completed'),
    buildTask('recitation', 12, 12, 'completed'),
    buildTask('listening', 12, 12, 'completed')
  ])

  assert.equal(isUnitLearned(partial), false)
  assert.equal(isUnitLearned(complete), true)
})

test('countLearnedWordsFromUnits only sums fully learned regular units', () => {
  const units = [
    buildUnit(1, 12, [
      buildTask('word', 12, 12, 'completed'),
      buildTask('recitation', 12, 12, 'completed'),
      buildTask('listening', 12, 12, 'completed')
    ]),
    buildUnit(2, 10, [
      buildTask('word', 10, 10, 'completed'),
      buildTask('recitation', 0, 10),
      buildTask('listening', 0, 10)
    ]),
    buildUnit(3, 8, [], { isReview: true, doneStages: 3 })
  ]

  assert.equal(countLearnedWordsFromUnits(units), 12)
  assert.equal(hasCompletedFirstUnit(units), true)
})

test('hasLearnedBook falls back to learningUnits from user-books summary', () => {
  const studied = {
    learningInfo: { book: { learningUnits: 1, learningWords: 12 } }
  }
  const untouched = {
    learningInfo: { book: { learningUnits: 0, learningWords: 0 } }
  }

  assert.equal(hasLearnedBook(studied), true)
  assert.equal(hasLearnedBook(untouched), false)
  assert.equal(getLearnedWordCount(studied), 12)
  assert.equal(getLearnedPercent({ wordCount: 100, learningInfo: studied.learningInfo }), 12)
})
