const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const practiceScript = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.js'), 'utf8')
const practiceTemplate = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.wxml'), 'utf8')
const practiceStyle = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.wxss'), 'utf8')

test('recitation learning mode blocks swiper finger swipes in swiperChanged', () => {
  assert.match(practiceTemplate, /disable-touch="{{from != 'search'}}"/)
  const swiperChangedBody = practiceScript.match(/swiperChanged\(e\)\s*{([\s\S]*?)\n  },/)
  assert.ok(swiperChangedBody)
  assert.match(swiperChangedBody[1], /source === 'touch'/)
  assert.match(swiperChangedBody[1], /this\.data\.from !== 'search'/)
  assert.match(swiperChangedBody[1], /setData\(\{\s*current:\s*revertTo/)
})

test('recitation learning mode blocks swiper changes with missing source unless code allowed them', () => {
  const swiperChangedBody = practiceScript.match(/swiperChanged\(e\)\s*{([\s\S]*?)\n  },/)
  assert.ok(swiperChangedBody)
  assert.match(swiperChangedBody[1], /source === ''/)
  assert.match(swiperChangedBody[1], /this\._allowRecitationSwiperChange !== current/)
})

test('recitation auto-next countdown supports immediate skip like the level quiz', () => {
  assert.match(practiceTemplate, /{{autoNextCountdown}} 秒后{{current >= contents\.length - 1 \? '提交' : '进入下一步'}}，<text class="auto-next-skip" catchtap="skipAutoNext">立即跳过<\/text>/)
  assert.match(practiceTemplate, /catchtap="pauseAutoNext"/)
  assert.match(practiceTemplate, /class="auto-next-cancel">取消<\/text>/)
  assert.match(practiceStyle, /\.auto-next-skip\s*{[^}]*color:\s*#2f6fed/s)

  const skipAutoNextBody = practiceScript.match(/skipAutoNext\(\)\s*{([\s\S]*?)\n  },/)
  assert.ok(skipAutoNextBody)
  assert.match(skipAutoNextBody[1], /this\.stopAutoNextCountdown\(\)/)
  assert.match(skipAutoNextBody[1], /this\.setData\(\{\s*autoNextCountdown:\s*0,\s*autoNextPaused:\s*false\s*\}\)/)
  assert.match(skipAutoNextBody[1], /this\.goAutoNext\(this\.data\.current\)/)
})
