const test = require('node:test')
const assert = require('node:assert/strict')
const {
  buildVipPurchaseQuery,
  navigateToVipPurchase
} = require('../utils/vip-purchase')

test('buildVipPurchaseQuery encodes book fields for advertisement page', () => {
  const query = buildVipPurchaseQuery({
    resBookId: 'book-2',
    name: '(新)七年级上册',
    bookCover: '/cover.png',
    wordCount: 486,
    proverbCount: 0,
    total: 12,
    press: '人教版',
    locked: true
  })

  assert.match(query, /resBookId=book-2/)
  assert.match(query, /name=\(%E6%96%B0\)/)
  assert.match(query, /unlocked=0/)
  assert.match(query, /press=%E4%BA%BA%E6%95%99%E7%89%88/)
})

test('navigateToVipPurchase opens advertisement page', () => {
  const calls = []
  global.wx = {
    navigateTo(options) {
      calls.push(options)
    }
  }
  global.getApp = () => ({ globalData: { book: {} } })

  navigateToVipPurchase({ resBookId: 'demo', name: 'Demo', locked: true })

  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /\/pages\/advertisement\/advertisement\?/)
  assert.match(calls[0].url, /resBookId=demo/)
})
