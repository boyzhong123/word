const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const appScript = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8')
const todayScript = fs.readFileSync(path.join(projectRoot, 'pages/today/today.js'), 'utf8')
const todayTemplate = fs.readFileSync(path.join(projectRoot, 'pages/today/today.wxml'), 'utf8')
const meScript = fs.readFileSync(path.join(projectRoot, 'pages/me/me.js'), 'utf8')
const meTemplate = fs.readFileSync(path.join(projectRoot, 'pages/me/me.wxml'), 'utf8')
const meStyle = fs.readFileSync(path.join(projectRoot, 'pages/me/me.wxss'), 'utf8')

const {
  resetVipFloatingGuideDismissed,
  dismissVipFloatingGuide,
  shouldShowVipFloatingGuide
} = require('../utils/vip-floating-guide')

function withMockApp(run) {
  const previousGetApp = global.getApp
  const globalData = { vipFloatingGuideDismissed: false }
  global.getApp = () => ({ globalData })
  try {
    run(globalData)
  } finally {
    global.getApp = previousGetApp
  }
}

test('vip floating guide resets on each mini-program launch', () => {
  assert.match(appScript, /resetVipFloatingGuideDismissed\(\)/)
  assert.match(appScript, /vipFloatingGuideDismissed:\s*false/)
})

test('vip floating guide stays hidden for non-members (auto VIP prompt disabled)', () => {
  withMockApp(globalData => {
    // 内容已全局免费解锁：非会员不再自动弹出「开通 VIP」诱导浮层，
    // 无论是否 dismiss / reset，都保持隐藏。
    resetVipFloatingGuideDismissed()
    assert.equal(globalData.vipFloatingGuideDismissed, false)
    assert.equal(shouldShowVipFloatingGuide({ active: false }), false)

    dismissVipFloatingGuide()
    assert.equal(shouldShowVipFloatingGuide({ active: false }), false)
  })
})

test('vip floating guide never shows for active members', () => {
  withMockApp(() => {
    resetVipFloatingGuideDismissed()
    assert.equal(shouldShowVipFloatingGuide({ active: true }), false)
  })
})

test('today and me pages share the same non-vip floating banner', () => {
  assert.match(todayScript, /shouldShowVipFloatingGuide/)
  assert.match(todayScript, /dismissVipFloatingGuide/)
  assert.doesNotMatch(todayScript, /home_vip_floating_dismissed_v1/)

  assert.match(meScript, /shouldShowVipFloatingGuide/)
  assert.match(meScript, /dismissVipFloatingGuide/)
  assert.match(meScript, /vip-floating-guide-banner\.png/)
  assert.match(meTemplate, /class="vip-floating-guide"/)
  assert.match(meTemplate, /closeVipFloatingGuide/)
  assert.match(meStyle, /\.vip-floating-guide\s*{/)
  assert.match(todayTemplate, /class="vip-floating-guide"/)
})
