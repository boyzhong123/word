const test = require('node:test')
const assert = require('node:assert/strict')
const {
  normalizeReturnTab,
  returnTabUrl,
  appendReturnTabQuery
} = require('../utils/return-tab')

test('normalizeReturnTab defaults to growth', () => {
  assert.equal(normalizeReturnTab(undefined), 'growth')
  assert.equal(normalizeReturnTab('growth'), 'growth')
  assert.equal(normalizeReturnTab('today'), 'today')
})

test('returnTabUrl maps tabs to switchTab routes', () => {
  assert.equal(returnTabUrl('today'), '/pages/today/today')
  assert.equal(returnTabUrl('growth'), '/pages/home/home')
})

test('appendReturnTabQuery appends returnTab to urls', () => {
  assert.equal(
    appendReturnTabQuery('/pages/practice/practice?unitId=1', 'today'),
    '/pages/practice/practice?unitId=1&returnTab=today'
  )
  assert.equal(
    appendReturnTabQuery('/pages/listen/listen', 'growth'),
    '/pages/listen/listen?returnTab=growth'
  )
})
