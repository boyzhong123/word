const test = require('node:test')
const assert = require('node:assert/strict')

function loadDevBooks(storage) {
  const state = Object.assign({}, storage || {})
  global.wx = {
    getStorageSync: key => state[key],
    setStorageSync: (key, value) => { state[key] = value },
    removeStorageSync: key => { delete state[key] },
    getStorageInfoSync: () => ({ keys: Object.keys(state) }),
    getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } })
  }

  delete require.cache[require.resolve('../utils/mock/mock-store')]
  delete require.cache[require.resolve('../utils/dev-books')]
  return require('../utils/dev-books')
}

test('applyDevPurchaseToBook unlocks books stored in mock-store purchasedBookIds', () => {
  const devBooks = loadDevBooks({
    __mock_state__: {
      purchasedBookIds: ['demo-rj-7a']
    }
  })

  const book = devBooks.applyDevPurchaseToBook({
    resBookId: 'demo-rj-7a',
    name: '(新)七年级上册',
    needVip: 1
  })

  assert.equal(book.unlocked, 1)
  assert.equal(book.needVip, 0)
})

test('applyDevPurchaseToBook leaves unpurchased books unchanged', () => {
  const devBooks = loadDevBooks({
    __mock_state__: {
      purchasedBookIds: ['demo-rj-7a']
    }
  })

  const book = devBooks.applyDevPurchaseToBook({
    resBookId: 'demo-rj-7b',
    name: '七年级下册',
    needVip: 1
  })

  assert.equal(book.needVip, 1)
  assert.equal(book.unlocked, undefined)
})
