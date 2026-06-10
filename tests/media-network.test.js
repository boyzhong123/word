const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const appScript = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8')
const mediaScript = fs.readFileSync(path.join(projectRoot, 'components/media/media.js'), 'utf8')
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
  assert.match(mediaTemplate, /class="record media-action-icon"/)
  assert.match(mediaTemplate, /class="bad media-action-icon"/)
  assert.match(mediaStyle, /\.media-action-icon\s*{[^}]*filter:\s*grayscale\(1\) brightness\(0\)/s)
  assert.match(mediaStyle, /\.good\s*{[^}]*background-color:\s*#111318/s)
  assert.doesNotMatch(mediaStyle, /\.good\s*{[^}]*background-color:\s*#2f80ed/s)
})