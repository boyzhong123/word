const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildQuizDevUnitResource,
  buildQuizDevUnitsList,
  QUIZ_DEV_UNIT_ID
} = require('../utils/quiz-dev-fixture')
const {
  buildListeningQuizQuestions,
  buildQuizStepList,
  hasFillStep,
  instantiateQuizQuestion
} = require('../pages/listen/listen-quiz')

test('quiz dev fixture exposes two words for three-step and two-step flows', () => {
  const units = buildQuizDevUnitsList()
  const source = buildQuizDevUnitResource()
  const questions = buildListeningQuizQuestions(source)

  assert.equal(units.length, 1)
  assert.equal(units[0].unitId, QUIZ_DEV_UNIT_ID)
  assert.equal(source.length, 2)
  assert.equal(questions.length, 2)

  const planet = instantiateQuizQuestion(questions[0], () => 0.3)
  assert.equal(questions[0].word, 'planet')
  assert.equal(questions[0].skipFill, undefined)
  assert.equal(hasFillStep(planet), true)
  assert.deepEqual(
    buildQuizStepList(true, true, true).map(step => step.key),
    ['fill', 'recite', 'spell']
  )

  const spade = instantiateQuizQuestion(questions[1], () => 0.3)
  assert.equal(questions[1].word, 'spade')
  assert.equal(questions[1].skipFill, true)
  assert.equal(hasFillStep(spade), false)
  assert.ok(spade.spell)
  assert.deepEqual(
    buildQuizStepList(false, true, true).map(step => step.key),
    ['recite', 'spell']
  )
})
