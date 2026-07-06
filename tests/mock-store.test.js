const test = require('node:test')
const assert = require('node:assert/strict')

const EXPECTED_SLICES = [
  'membership',
  'purchasedBookIds',
  'membershipOrders',
  'studentProfile',
  'characterGender',
  'characterAssets',
  'studyPlans',
  'dailyProgress',
  'entryExamPrompts',
  'subscribePrefs',
  'subscribeQuota',
  'listeningWrongWords',
  'invite',
  'examResults'
]

function loadMockStore(initialStorage) {
  const storage = Object.assign({}, initialStorage || {})
  global.wx = {
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = value },
    removeStorageSync: key => { delete storage[key] },
    getStorageInfoSync: () => ({ keys: Object.keys(storage) })
  }
  delete require.cache[require.resolve('../utils/mock/mock-store')]
  return {
    mockStore: require('../utils/mock/mock-store'),
    storage
  }
}

test('mock store exposes the 14 documented business-state slices', () => {
  const { mockStore } = loadMockStore()
  const state = mockStore.defaultState()

  assert.deepEqual(Object.keys(state), EXPECTED_SLICES)
})

test('mock mode persists business state only under the single mock-state key', () => {
  const { mockStore, storage } = loadMockStore()

  mockStore.setSlice('subscribeQuota', { checkinRemindCount: 2 })

  assert.deepEqual(Object.keys(storage), [mockStore.MOCK_STATE_KEY])
  assert.deepEqual(storage[mockStore.MOCK_STATE_KEY].subscribeQuota, {
    checkinRemindCount: 2
  })
})

test('first mock-store load removes retired scattered business keys', () => {
  const { mockStore, storage } = loadMockStore({
    membership: { expireAt: Date.now() + 86400000 },
    studentProfile: { gradeId: 'g3' },
    studyPlan_book1: { groupsPerDay: 2 },
    exam_result_book1_entry: { total: 10 }
  })

  mockStore.getSlice('membership')

  assert.equal(storage.membership, undefined)
  assert.equal(storage.studentProfile, undefined)
  assert.equal(storage.studyPlan_book1, undefined)
  assert.equal(storage.exam_result_book1_entry, undefined)
  assert.ok(storage[mockStore.MOCK_STATE_KEY])
})
