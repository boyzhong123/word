const test = require('node:test')
const assert = require('node:assert/strict')

const storage = {}

global.wx = {
  setStorageSync(key, value) {
    storage[key] = value
  },
  getStorageSync(key) {
    return storage[key]
  },
  removeStorageSync(key) {
    delete storage[key]
  },
  getStorageInfoSync() {
    return { keys: Object.keys(storage) }
  }
}

const {
  recordEntryExamPrompt,
  shouldShowEntryExamPrompt
} = require('../utils/entry-exam-prompt')

test('entry exam prompt shows once per book per day, never when book has a result', () => {
  // 无成绩、今天没弹过 → 应弹
  assert.equal(shouldShowEntryExamPrompt('book-1', false), true)
  // 已有 entry 成绩 → 永不弹
  assert.equal(shouldShowEntryExamPrompt('book-1', true), false)

  // 今天弹过这本书 → 今天不再弹
  recordEntryExamPrompt('book-1')
  assert.equal(shouldShowEntryExamPrompt('book-1', false), false)

  // 另一本书互不影响 → 仍应弹
  assert.equal(shouldShowEntryExamPrompt('book-2', false), true)

  // 没有 resBookId → 不弹
  assert.equal(shouldShowEntryExamPrompt('', false), false)
})

test('entry exam prompt re-shows on a new day', () => {
  recordEntryExamPrompt('book-3')
  assert.equal(shouldShowEntryExamPrompt('book-3', false), false)

  // 模拟「昨天弹过」：把记录日期改成过去 → 今天应再弹
  const state = storage['__mock_state__']
  state.entryExamPrompts['book-3'].lastPromptedDate = '2000-01-01'
  assert.equal(shouldShowEntryExamPrompt('book-3', false), true)
})
