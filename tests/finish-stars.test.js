const test = require('node:test')
const assert = require('node:assert/strict')
const {
  starsForScoreRate,
  headerImageForScoreRate,
  computePracticeScoreRate,
  computeWordNewScoreRate,
  computeQuizScoreRate,
  normalizeScoreRate
} = require('../utils/finish-stars')

test('finish stars follow score thresholds 55 and 80', () => {
  assert.equal(starsForScoreRate(0), 1)
  assert.equal(starsForScoreRate(54), 1)
  assert.equal(starsForScoreRate(55), 2)
  assert.equal(starsForScoreRate(79), 2)
  assert.equal(starsForScoreRate(80), 3)
  assert.equal(starsForScoreRate(100), 3)
})

test('finish header image switches by score rate', () => {
  assert.match(headerImageForScoreRate(40), /finish-today-header-1star\.png$/)
  assert.match(headerImageForScoreRate(70), /finish-today-header-2star\.png$/)
  assert.match(headerImageForScoreRate(95), /finish-today-header-3star\.png$/)
})

test('practice score rate averages pronunciation scores', () => {
  const scoreRate = computePracticeScoreRate([
    { word: { result: { score: 80 } }, proverb: [{ result: { score: 60 } }] },
    { word: { result: { score: 90 } }, proverb: [{ result: { score: 70 } }] }
  ])
  assert.equal(scoreRate, 75)
})

test('word new score rate reflects known and mistaken answers', () => {
  const scoreRate = computeWordNewScoreRate([
    { known: true },
    { mistaken: true },
    { known: false }
  ])
  assert.equal(scoreRate, 60)
})

test('quiz score rate blends fill accuracy and recite scores', () => {
  const scoreRate = computeQuizScoreRate([
    { fillCorrect: true, reciteScore: 80 },
    { fillCorrect: false, reciteScore: 60 }
  ], 2)
  assert.equal(scoreRate, 60)
})

test('score rate normalizes invalid values to safe bounds', () => {
  assert.equal(normalizeScoreRate('abc'), 0)
  assert.equal(normalizeScoreRate(120), 100)
})
