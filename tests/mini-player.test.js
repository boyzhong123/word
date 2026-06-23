const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const tabBarScript = fs.readFileSync(path.join(projectRoot, 'custom-tab-bar/index.js'), 'utf8')
const tabBarTemplate = fs.readFileSync(path.join(projectRoot, 'custom-tab-bar/index.wxml'), 'utf8')
const tabBarConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'custom-tab-bar/index.json'), 'utf8'))

test('mini player subscribes to player.active and renders the progress track', () => {
  assert.match(tabBarScript, /miniActive:\s*s\.active/)
  assert.doesNotMatch(tabBarScript, /miniActive:\s*s\.started/)
  assert.match(tabBarTemplate, /class="mini-progress-track"/)
  assert.match(tabBarTemplate, /miniProgress/)
})

test('mini player returns to the real listen page instead of mounting a tab-bar overlay', () => {
  assert.match(tabBarScript, /wx\.navigateTo\(\{[\s\S]*\/pages\/listen\/listen\?resBookId=/)
  assert.match(tabBarScript, /ensureActiveBook/)
  assert.match(tabBarScript, /player\.start\(/)
  assert.doesNotMatch(tabBarScript, /selectComponent\('#listen-player'\)/)
  assert.doesNotMatch(tabBarTemplate, /<listen-player/)
  assert.equal(tabBarConfig.usingComponents && tabBarConfig.usingComponents['listen-player'], undefined)
})

test('player buildTracks falls back to tts when unit audio is missing', () => {
  const playerScript = fs.readFileSync(path.join(projectRoot, 'utils/player.js'), 'utf8')
  assert.match(playerScript, /buildVoiceUrl/)
  assert.match(playerScript, /resolveTrackAudio/)
})

test('player resumes playback when re-entering an active listen session', () => {
  const playerScript = fs.readFileSync(path.join(projectRoot, 'utils/player.js'), 'utf8')
  assert.match(playerScript, /if \(this\.isActiveFor\(resBookId\)\)\s*{[\s\S]*!this\.playing\)[\s\S]*this\.play\(\)/)
})

test('listen turntable tonearm snaps to disc when entering while playing', () => {
  const listenScript = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.js'), 'utf8')
  const listenTemplate = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.wxml'), 'utf8')
  const listenStyle = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.wxss'), 'utf8')

  assert.match(listenScript, /tonearmInstant:\s*false/)
  assert.match(listenScript, /patch\.tonearmInstant\s*=\s*true/)
  assert.match(listenTemplate, /tonearm-instant/)
  assert.match(listenStyle, /\.tonearm\.tonearm-instant/)
})
