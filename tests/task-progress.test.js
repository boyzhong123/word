const test = require('node:test')
const assert = require('node:assert/strict')
const {
  getTaskResumeIndex,
  resolveWordMarkStatus,
  computeRecitationItemScore,
  buildWordMarkPayload,
  shouldReportStep
} = require('../utils/task-progress')

function buildUnits(current, mapState) {
  return {
    list: [{
      unitId: 'u1',
      tasks: [{ type: 'word', current, total: 10, mapState }]
    }]
  }
}

test('getTaskResumeIndex returns task current for active tasks', () => {
  assert.equal(getTaskResumeIndex(buildUnits(5, 'active'), 'u1', 'word'), 5)
})

test('getTaskResumeIndex returns 0 for completed tasks', () => {
  assert.equal(getTaskResumeIndex(buildUnits(10, 'completed'), 'u1', 'word'), 0)
})

test('resolveWordMarkStatus prefers mistaken over known', () => {
  assert.equal(resolveWordMarkStatus({ known: true, mistaken: true }), 'mistaken')
  assert.equal(resolveWordMarkStatus({ known: true }), 'known')
})

test('computeRecitationItemScore averages word and proverb scores', () => {
  const score = computeRecitationItemScore({
    word: { result: { score: 80 } },
    proverb: [{ result: { score: 60 } }]
  })
  assert.equal(score, 70)
})

test('buildWordMarkPayload includes task metadata', () => {
  const payload = buildWordMarkPayload({
    item: { word: { id: 'w1', content: 'cat' }, known: true, wordChoiceCorrect: true },
    unitId: 'u1',
    resBookId: 'rb1',
    wordIndex: 2,
    timeSpentSeconds: 9
  })
  assert.equal(payload.status, 'known')
  assert.equal(payload.wordIndex, 2)
  assert.equal(payload.resBookId, 'rb1')
})

test('shouldReportStep skips indices below resume point', () => {
  assert.equal(shouldReportStep(4, 5), false)
  assert.equal(shouldReportStep(5, 5), true)
})
