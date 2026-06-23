const test = require('node:test')
const assert = require('node:assert/strict')

const {
  isDemoUnitId,
  buildDemoUnitResource,
  buildDemoUnitsList,
  getDemoWordsForUnit
} = require('../utils/demo-unit-mock')
const { FALLBACK_UNITS } = require('../utils/fallback-units')

test('fallback units carry demo unit ids for local practice', () => {
  assert.equal(FALLBACK_UNITS.length, 3)
  assert.deepEqual(
    FALLBACK_UNITS.map(unit => unit.unitId),
    ['demo-unit-1', 'demo-unit-2', 'demo-unit-3']
  )
})

test('buildDemoUnitResource returns getUnitResource-shaped items', () => {
  const data = buildDemoUnitResource('demo-unit-2')
  assert.equal(data.length, 12)
  assert.equal(data[0].unit.unitId, 'demo-unit-2')
  assert.equal(data[0].word.content, 'school')
  assert.equal(data[0].proverb[0].content, 'We go to school five days a week.')
  assert.match(data[0].word.audio, /^https:\/\/dict\.youdao\.com\/dictvoice/)
  assert.match(data[0].proverb[0].audio, /^https:\/\/dict\.youdao\.com\/dictvoice/)
})

test('demo unit resource includes audio for listen playback', () => {
  const data = buildDemoUnitResource('demo-unit-1')
  assert.equal(data.length, 12)
  data.forEach(item => {
    assert.match(item.word.audio, /^https:\/\/dict\.youdao\.com\/dictvoice/)
    assert.match(item.proverb[0].audio, /^https:\/\/dict\.youdao\.com\/dictvoice/)
  })
})

test('demo unit ids are recognized', () => {
  assert.equal(isDemoUnitId('demo-unit-1'), true)
  assert.equal(isDemoUnitId('unit-1'), false)
})

test('buildDemoUnitsList matches fallback unit ids', () => {
  const ids = buildDemoUnitsList().map(unit => unit.unitId)
  assert.deepEqual(ids, FALLBACK_UNITS.map(unit => unit.unitId))
})

test('each demo unit has twelve words', () => {
  ;[1, 2, 3].forEach(sort => {
    assert.equal(getDemoWordsForUnit(sort).length, 12)
  })
})

test('resolveDemoUnitResource falls back to unit 1 words for unknown ids', () => {
  const { resolveDemoUnitResource } = require('../utils/demo-unit-mock')
  const data = resolveDemoUnitResource('backend-unit-999')
  assert.equal(data.length, 12)
  assert.equal(data[0].word.content, 'apple')
})
