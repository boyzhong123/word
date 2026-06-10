const test = require('node:test')
const assert = require('node:assert/strict')

const { buildMockReviewResource } = require('../utils/review-mock')
const {
  buildLearningWords,
  buildListeningQuizQuestions
} = require('../pages/listen/listen-quiz')

test('buildMockReviewResource returns getUnitResource-shaped items', () => {
  const data = buildMockReviewResource(['unit-1', 'unit-2', 'unit-3'])

  assert.ok(Array.isArray(data) && data.length > 0)
  data.forEach(item => {
    assert.equal(item.needVip, 0)
    assert.equal(item.isReview, true)
    assert.equal(item.unit.unitId, 'unit-1')
    assert.ok(item.word.content)
    assert.ok(Array.isArray(item.word.pages))
    assert.ok(Array.isArray(item.proverb) && item.proverb[0].content)
  })
})

test('buildMockReviewResource falls back to a safe unit id without review ids', () => {
  const data = buildMockReviewResource([])
  assert.equal(data[0].unit.unitId, 'review')
})

test('mock review data feeds the listening quiz builders', () => {
  const data = buildMockReviewResource(['unit-1'])

  const words = buildLearningWords(data)
  assert.ok(words.length > 0)

  const questions = buildListeningQuizQuestions(data)
  assert.ok(questions.length > 0)
  assert.ok(questions.every(question => question.gaps.length > 0))
})
