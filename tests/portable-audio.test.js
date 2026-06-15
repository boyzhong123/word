const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const playerScript = fs.readFileSync(path.join(projectRoot, 'utils/player.js'), 'utf8')
const appConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'))
const practiceScript = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.js'), 'utf8')
const examScript = fs.readFileSync(path.join(projectRoot, 'pages/exam/exam.js'), 'utf8')
const listenScript = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.js'), 'utf8')

test('portable player uses BackgroundAudioManager for background playback', () => {
  assert.match(playerScript, /wx\.getBackgroundAudioManager\(\)/)
  assert.doesNotMatch(playerScript, /createInnerAudioContext/)
  assert.deepEqual(appConfig.requiredBackgroundModes, ['audio'])
})

test('portable player exposes suspend/resume for secondary pages with local audio', () => {
  assert.match(playerScript, /suspendForExternalAudio\(/)
  assert.match(playerScript, /resumeFromExternalAudio\(/)
  assert.match(practiceScript, /suspendForExternalAudio\('practice'\)/)
  assert.match(practiceScript, /resumeFromExternalAudio\('practice'\)/)
  assert.match(examScript, /suspendForExternalAudio\('exam'\)/)
  assert.match(examScript, /resumeFromExternalAudio\('exam'\)/)
  assert.match(listenScript, /suspendForExternalAudio\('listen-quiz'\)/)
  assert.match(listenScript, /resumeFromExternalAudio\('listen-quiz'\)/)
})
