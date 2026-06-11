const test = require('node:test')
const assert = require('node:assert/strict')

const {
  normalizeUnitResource,
  buildListeningQuizQuestions,
  instantiateQuizQuestion
} = require('../pages/listen/listen-quiz')

function simulateLoadUnit(apiPayload) {
  const source = normalizeUnitResource(apiPayload)
  const quizQuestions = buildListeningQuizQuestions(source)
  const firstQuestion = quizQuestions[0]
    ? instantiateQuizQuestion(quizQuestions[0], () => 0.42)
    : null

  return {
    sourceCount: source.length,
    quizCount: quizQuestions.length,
    firstQuestion
  }
}

test('listen quiz load handles API unit payload with Chinese content and English label', () => {
  const result = simulateLoadUnit([
    {
      unit: { unitId: '101', sort: 1, unitName: '第1期' },
      word: { content: 'beverage', translation: '饮料', audio: 'https://example.test/beverage.mp3' },
      proverb: [{
        content: '一项新研究发现，含有添加糖的饮料可能有害。',
        label: 'A new study finds that beverages containing added sugar might be harmful.',
        translation: '一项新研究发现，含有添加糖的饮料可能有害。',
        audio: 'https://example.test/sentence.mp3'
      }]
    },
    {
      unit: { unitId: '101', sort: 1, unitName: '第1期' },
      word: { content: 'study', translation: '研究', audio: 'https://example.test/study.mp3' },
      proverb: [{
        content: '一项新研究发现，含有添加糖的饮料可能有害。',
        label: 'A new study finds that beverages containing added sugar might be harmful.',
        translation: '一项新研究发现，含有添加糖的饮料可能有害。',
        audio: 'https://example.test/sentence.mp3'
      }]
    }
  ])

  assert.equal(result.sourceCount, 2)
  assert.ok(result.quizCount >= 2)
  assert.ok(result.firstQuestion)
  assert.ok(result.firstQuestion.parts.some(part => part.type === 'blank'))
})

test('listen quiz load reproduces previous empty-state case before label fix', () => {
  const result = simulateLoadUnit([
    {
      word: { content: 'apple' },
      proverb: [{
        content: '桌子上有一个苹果。',
        label: 'There is an apple on the table.',
        translation: '桌子上有一个苹果。'
      }]
    }
  ])

  assert.equal(result.quizCount, 1)
  assert.equal(result.firstQuestion.sentence, 'There is an apple on the table.')
})
