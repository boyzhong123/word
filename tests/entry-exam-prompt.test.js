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
  }
}

const {
  markEntryExamPromptPending,
  isEntryExamPromptPending,
  dismissEntryExamPrompt,
  shouldShowEntryExamPrompt
} = require('../utils/entry-exam-prompt')

test('entry exam prompt shows only when pending and not dismissed', () => {
  markEntryExamPromptPending()
  assert.equal(isEntryExamPromptPending(), true)
  assert.equal(shouldShowEntryExamPrompt('book-1', false), true)
  assert.equal(shouldShowEntryExamPrompt('book-1', true), false)

  dismissEntryExamPrompt()
  assert.equal(isEntryExamPromptPending(), false)
  assert.equal(shouldShowEntryExamPrompt('book-1', false), false)
})
