const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const {
  pickRecordingRect,
  syncRecordingOverlay,
  hideRecordingOverlay
} = require('../utils/recording-overlay')

test('pickRecordingRect prefers media bounds over panel fallback', () => {
  const media = { top: 420, left: 24, width: 320, height: 168 }
  const panel = { top: 360, left: 0, width: 375, height: 240 }
  const picked = pickRecordingRect(media, panel)
  assert.equal(picked.top, 420)
  assert.equal(picked.height, 168)
})

test('syncRecordingOverlay writes media-aligned overlay patch', () => {
  const calls = []
  const page = {
    data: {
      recordingOverlay: { active: false, waveSession: 0 }
    },
    createSelectorQuery() {
      const chain = {
        select() {
          return chain
        },
        boundingClientRect() {
          return chain
        },
        exec(fn) {
          fn([
            { top: 500, left: 20, width: 300, height: 160 },
            { top: 440, left: 0, width: 360, height: 220 }
          ])
        }
      }
      return chain
    },
    setData(patch) {
      calls.push(patch)
    }
  }
  syncRecordingOverlay(page, {
    overlayKey: 'recordingOverlay',
    mediaSelector: '.media'
  })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].recordingOverlay.top, 500)
  assert.equal(calls[0].recordingOverlay.height, 160)
  assert.equal(calls[0].recordingOverlay.waveSession, 1)
})

test('practice page uses canvas recording overlay for scroll-view media', () => {
  const practiceScript = fs.readFileSync(path.join(__dirname, '../pages/practice/practice.js'), 'utf8')
  const practiceTemplate = fs.readFileSync(path.join(__dirname, '../pages/practice/practice.wxml'), 'utf8')
  const practiceStyle = fs.readFileSync(path.join(__dirname, '../pages/practice/practice.wxss'), 'utf8')
  assert.match(practiceScript, /syncRecordingOverlay\(/)
  assert.match(practiceScript, /hideRecordingOverlay\(/)
  assert.match(practiceTemplate, /overlay-record="{{true}}"/)
  assert.match(practiceTemplate, /recording-overlay/)
  assert.match(practiceTemplate, /<wave-line wx:key="rw-\{\{recordingOverlay\.waveSession\}\}" class="recording-overlay-wave" \/>/)
  assert.doesNotMatch(practiceTemplate, /<wave-line[^>]*variant="css"/)
  assert.match(practiceStyle, /\.media \.recording\s*{[^}]*display:\s*none !important/s)
})

test('hideRecordingOverlay clears active flag but keeps wave session', () => {
  const calls = []
  const page = {
    data: {
      recordingOverlay: { active: true, top: 1, left: 2, width: 3, height: 4, waveSession: 7 }
    },
    setData(patch) {
      calls.push(patch)
    }
  }
  hideRecordingOverlay(page, { overlayKey: 'recordingOverlay' })
  assert.deepEqual(calls[0].recordingOverlay, {
    active: false,
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    waveSession: 7
  })
})
