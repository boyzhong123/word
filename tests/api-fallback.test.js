const test = require('node:test')
const assert = require('node:assert/strict')

function loadApiWithBusinessError() {
  const globalData = {
    BASE_URL: 'https://example.test',
    token: 'token'
  }
  const storage = { token: 'token' }

  global.getApp = () => ({ globalData })
  global.wx = {
    getNetworkType: ({ success }) => {
      setImmediate(() => success({ networkType: 'wifi' }))
    },
    request: options => {
      setImmediate(() => {
        options.success({
          statusCode: 200,
          data: {
            status: 'fail',
            message: '教材接口暂不可用'
          }
        })
      })
      return { abort() {} }
    },
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = value },
    showToast: () => {}
  }

  delete require.cache[require.resolve('../utils/util')]
  delete require.cache[require.resolve('../utils/api')]
  return require('../utils/api')
}

test('getUserBooks resolves to an empty list when business response fails', async () => {
  const { getUserBooks } = loadApiWithBusinessError()
  const timedOut = Symbol('timed-out')

  const result = await Promise.race([
    getUserBooks(),
    new Promise(resolve => setTimeout(() => resolve(timedOut), 50))
  ])

  assert.notEqual(result, timedOut)
  assert.deepEqual(result, [])
})

test('getUnitResource resolves demo word and sentence data when business response fails', async () => {
  const { getUnitResource } = loadApiWithBusinessError()
  const timedOut = Symbol('timed-out')

  const result = await Promise.race([
    getUnitResource('backend-unit-42'),
    new Promise(resolve => setTimeout(() => resolve(timedOut), 50))
  ])

  assert.notEqual(result, timedOut)
  assert.equal(Array.isArray(result), true)
  assert.equal(result.length, 12)
  assert.equal(result[0].unit.unitId, 'backend-unit-42')
  assert.equal(result[0].word.content, 'apple')
  assert.equal(result[0].proverb[0].content, 'There is an apple on the table.')
})
