const test = require('node:test')
const assert = require('node:assert/strict')

const {
  findGuideTrackIndex,
  LISTEN_GUIDE_DONE_KEY
} = require('../utils/listen-guide')

test('findGuideTrackIndex prefers the first sentence track', () => {
  const tracks = [
    { type: 'word', content: 'apple' },
    { type: 'sentence', content: 'An apple a day.' },
    { type: 'sentence', content: 'Keep the doctor away.' }
  ]
  assert.equal(findGuideTrackIndex(tracks), 1)
})

test('findGuideTrackIndex falls back to the first track when no sentence exists', () => {
  const tracks = [
    { type: 'word', content: 'apple' },
    { type: 'word', content: 'banana' }
  ]
  assert.equal(findGuideTrackIndex(tracks), 0)
})

test('findGuideTrackIndex returns -1 for empty playlists', () => {
  assert.equal(findGuideTrackIndex([]), -1)
})

test('listen guide storage key is stable', () => {
  assert.equal(LISTEN_GUIDE_DONE_KEY, 'listen-first-guide-done')
})
