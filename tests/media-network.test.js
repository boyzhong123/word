const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const appScript = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8')
const mediaScript = fs.readFileSync(path.join(projectRoot, 'components/media/media.js'), 'utf8')
const scoringSessionScript = fs.readFileSync(path.join(projectRoot, 'components/media/scoring-session.js'), 'utf8')
const mediaTemplate = fs.readFileSync(path.join(projectRoot, 'components/media/media.wxml'), 'utf8')
const mediaStyle = fs.readFileSync(path.join(projectRoot, 'components/media/media.wxss'), 'utf8')

test('app initializes network status before relying on network change events', () => {
  assert.match(appScript, /function\s+updateNetworkStatus\s*\(\s*networkType\s*\)/)
  assert.match(appScript, /wx\.getNetworkType\s*\(/)
  assert.match(appScript, /wx\.onNetworkStatusChange\s*\(/)
  assert.ok(appScript.indexOf('wx.getNetworkType') < appScript.indexOf('wx.onNetworkStatusChange'))
})

test('recording checks current network instead of only cached state', () => {
  assert.match(mediaScript, /record\(\)\s*{\s*wx\.getNetworkType\s*\(/)
  assert.match(mediaScript, /const\s+isConnected\s*=\s*networkType\s*!==\s*'none'/)
  assert.match(mediaScript, /doRecordAction\(\)/)
  assert.match(mediaScript, /showNetworkDisconnected\(\)/)
  assert.doesNotMatch(mediaScript, /record\(\)\s*{\s*if\s*\(\s*wx\.getStorageSync\('isConnected'\)\s*\)/)
})

test('practice media action buttons use the black recitation palette', () => {
  assert.match(mediaTemplate, /class="frames media-action-icon"/)
  assert.match(mediaTemplate, /state="paused"/)
  assert.match(mediaTemplate, /class="record media-action-icon"/)
  assert.match(mediaTemplate, /class="bad media-action-icon"/)
  assert.match(mediaStyle, /\.media-action-icon\s*{[^}]*filter:\s*grayscale\(1\) brightness\(0\)/s)
  assert.match(mediaStyle, /\.good\s*{[^}]*background-color:\s*#111318/s)
  assert.doesNotMatch(mediaStyle, /\.good\s*{[^}]*background-color:\s*#2f80ed/s)
})

test('media demo audio stops previous playback and emits beforeplay', () => {
  assert.match(mediaScript, /useWebAudioImplement:\s*false/)
  assert.match(mediaScript, /triggerEvent\('beforeplay'\)/)
  assert.match(mediaScript, /ctx\.stop\(\)/)
})

test('media scoring failures always leave marking state', () => {
  assert.match(mediaScript, /wsEngine\.stop\(\{[\s\S]*fail:\s*\(res\)\s*=>\s*{[\s\S]*resetMarkingState\(/)
  assert.match(mediaScript, /onErrorResult\(res\s*=>\s*{[\s\S]*resetMarkingState\(/)
  assert.match(mediaScript, /recorderManager\.onError\(\(res\)\s*=>\s*{[\s\S]*resetMarkingState\(/)
})

test('media scoring watchdog waits longer than the SDK result timeout', () => {
  assert.match(mediaScript, /const\s+MARK_TIMEOUT_MS\s*=\s*20000/)
  assert.match(mediaScript, /const\s+STOP_RESULT_TIMEOUT_MS\s*=\s*15000/)
  assert.match(mediaScript, /timeout:\s*STOP_RESULT_TIMEOUT_MS/)
  assert.match(mediaScript, /startMarkWatchdog\(\)\s*{[\s\S]*resetMarkingState\(/)
  assert.match(mediaScript, /},\s*MARK_TIMEOUT_MS\)/)
})

test('media falls back to mock scoring inside devtools (recorder emits WebM, not mp3)', () => {
  assert.match(mediaScript, /platform\s*===\s*'devtools'/)
  assert.match(mediaScript, /devtoolsMock/)
  assert.match(mediaScript, /claimSessionHandlers\(this\)/)
  assert.match(mediaScript, /function claimSessionHandlers\(media\)/)
})

test('media binds recorder callbacks once and routes events to the active scorer', () => {
  assert.match(mediaScript, /let\s+recorderBound\s*=\s*false/)
  assert.match(mediaScript, /function bindRecorderEvents\(\)/)
  assert.match(mediaScript, /if\s*\(\s*recorderBound\s*\)\s*{[\s\S]*return/)
  assert.match(scoringSessionScript, /function\s+routeMediaTarget\s*\(\)/)
  assert.match(scoringSessionScript, /scoringMedia\s*\|\|\s*activeMedia\s*\|\|\s*fallbackMedia/)
  assert.doesNotMatch(mediaScript, /if\s*\(\s*activeMedia\s*!==\s*that\s*\)/)
})

test('media keeps scoring target until result and protects cancel during marking', () => {
  assert.match(scoringSessionScript, /media\._scoringActive\s*=\s*true/)
  assert.match(mediaScript, /if\s*\(\s*!wsEngine\s*\|\|\s*engineBound\s*\)\s*{[\s\S]*return/)
  assert.match(mediaScript, /scoringSession\.shouldProtectFromCancel\(this\)/)
  assert.match(scoringSessionScript, /function\s+shouldProtectFromCancel/)
})

test('media waits for a valid signature and keeps scorer active during fetch', () => {
  assert.match(mediaScript, /let\s+cachedSig\s*=\s*null/)
  assert.match(mediaScript, /let\s+sigPromise\s*=\s*null/)
  assert.match(mediaScript, /function\s+isValidSig\s*\(sig\)/)
  assert.match(mediaScript, /refreshSig\(force\)\s*{[\s\S]*if\s*\(!force\s*&&\s*isValidSig\(cachedSig\)\)/)
  assert.match(mediaScript, /this\.refreshSig\(\!\!force\)\.then/)
  assert.match(mediaScript, /doRecord\(\)\s*{[\s\S]*if\s*\(this\.preparingRecord\)/)
  assert.match(mediaScript, /if\s*\(isValidSig\(this\.data\._sig\)\)\s*{[\s\S]*start\(\)/)
  assert.match(mediaScript, /scoringSession\.setActiveMedia\(this\)/)
})
