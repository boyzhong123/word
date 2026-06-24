const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  findGuideTrackIndex,
  LISTEN_GUIDE_DONE_KEY
} = require('../utils/listen-guide')

const listenTemplate = fs.readFileSync(
  path.join(__dirname, '../pages/listen/listen.wxml'),
  'utf8'
)

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

test('microphone permission guide explains the system authorization step', () => {
  assert.match(listenTemplate, />跟读需要麦克风</)
  assert.match(
    listenTemplate,
    /需要录下你的发音进行评分。点击「继续」后，请在系统弹窗中选择「允许」。/
  )
  assert.match(
    listenTemplate,
    /catchtap="onListenGuidePermissionAllow">继续</
  )
})
