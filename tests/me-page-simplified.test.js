const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const meScript = fs.readFileSync(path.join(projectRoot, 'pages/me/me.js'), 'utf8')
const meTemplate = fs.readFileSync(path.join(projectRoot, 'pages/me/me.wxml'), 'utf8')
const meStyle = fs.readFileSync(path.join(projectRoot, 'pages/me/me.wxss'), 'utf8')

test('me page keeps the menu focused on common actions', () => {
  assert.match(meScript, /label: '我的教材'/)
  assert.match(meScript, /label: '联系客服'/)
  assert.match(meScript, /label: '隐私与协议'/)

  // 消息授权状态不再作为独立菜单项，已并入「消息与关注」卡片
  assert.doesNotMatch(meScript, /label: '消息授权状态'/)

  assert.doesNotMatch(meScript, /label: '会员中心'/)
  assert.doesNotMatch(meScript, /label: '错词本'/)
  assert.doesNotMatch(meScript, /label: '学习成就'/)
  assert.doesNotMatch(meScript, /label: '意见反馈'/)
  assert.doesNotMatch(meScript, /label: '关于我们'/)
})

test('me page removes VIP entry points from the profile area', () => {
  assert.doesNotMatch(meTemplate, /vip-badge/)
  assert.doesNotMatch(meTemplate, /bindtap="goVip"/)
  assert.doesNotMatch(meScript, /goVip/)
  assert.doesNotMatch(meScript, /isVip/)
  assert.doesNotMatch(meStyle, /menu-ic-vip/)
  assert.doesNotMatch(meTemplate, /开通/)
})

test('me page uses a message and official-account center instead of duplicated plans', () => {
  assert.match(meScript, /requestSubscribe\(\)/)
  assert.match(meTemplate, /class="section-title">消息与关注/)
  assert.match(meTemplate, /bindtap="openOfficialAccount"/)
  assert.match(meTemplate, /bindtap="requestSubscribe"/)
  assert.match(meTemplate, /关注公众号，领取学习资料/)
  assert.match(meTemplate, /class="message-row"/)
  // 「管理微信消息授权」折入卡片底部，不再单列菜单
  assert.match(meTemplate, /bindtap="openSetting"/)
  assert.match(meScript, /openSetting\(\)/)
  assert.doesNotMatch(meTemplate, /message-grid/)
  assert.doesNotMatch(meTemplate, /今日学习/)
  assert.doesNotMatch(meTemplate, /继续学/)
})

test('me page uses the jelly monster header and clean card stack', () => {
  assert.match(meTemplate, /me-profile-header-monster-v2\.png/)
  assert.match(meTemplate, /class="section-title">常用/)
  assert.match(meTemplate, /class="section-title">账号设置/)
  assert.match(meTemplate, /class="menu-copy"/)
  assert.match(meTemplate, /class="menu-desc"/)
  assert.match(meStyle, /\.profile-header-bg\s*{[^}]*position:\s*absolute/s)
  assert.match(meStyle, /background:\s*#fffdf8/)
  assert.doesNotMatch(meStyle, /\.profile-header::before\s*{[^}]*content:\s*'A B C'/s)
  assert.doesNotMatch(meStyle, /\.message-grid\s*{/)
})

test('me page lets users refresh WeChat avatar and nickname from the profile header', () => {
  const apiScript = fs.readFileSync(path.join(projectRoot, 'utils/api.js'), 'utf8')

  assert.match(meTemplate, /open-type="chooseAvatar"/)
  assert.match(meTemplate, /bindchooseavatar="handleChooseAvatar"/)
  assert.match(meTemplate, /type="nickname"/)
  assert.match(meTemplate, /bindblur="handleNickNameBlur"/)
  assert.match(meStyle, /\.profile-main\s*{[^}]*justify-content:\s*flex-start/s)
  assert.match(meStyle, /\.avatar-wrap\s*{[^}]*width:\s*108rpx[^}]*height:\s*108rpx/s)
  assert.match(meStyle, /\.avatar-button\s*{[^}]*width:\s*108rpx[^}]*height:\s*108rpx/s)
  assert.match(meScript, /saveUserInfo/)
  assert.match(meScript, /handleChooseAvatar\(event\)/)
  assert.match(meScript, /commitNickName\(/)
  assert.match(apiScript, /saveUserInfo/)
})

test('me page adds WeChat phone verification in account settings', () => {
  const apiScript = fs.readFileSync(path.join(projectRoot, 'utils/api.js'), 'utf8')

  assert.match(meScript, /label: '手机号验证'/)
  assert.match(meScript, /id: 'phone'/)
  assert.match(meScript, /statusText: verified \? '已验证' : '去验证'/)
  assert.match(meScript, /openType: canVerifyPhone \? 'getPhoneNumber' : ''/)
  assert.match(meTemplate, /class="menu-status menu-status-{{statusType}}"/)
  assert.match(meTemplate, /bindgetphonenumber="handleGetPhoneNumber"/)
  assert.match(meTemplate, /class="menu-status menu-status-{{statusType}} menu-status-action"/)
  assert.match(meTemplate, /class="menu-status-hit"/)
  assert.match(meStyle, /\.menu-status-action\s*{/)
  assert.match(meStyle, /\.menu-status-hit\s*{/)
  assert.match(meStyle, /\.menu-ic-phone\s*{/)
  assert.match(meStyle, /\.menu-status-verified\s*{/)
  assert.match(meScript, /handleGetPhoneNumber\(event\)/)
  assert.match(meScript, /bindPhoneNumber/)
  assert.match(apiScript, /function bindPhoneNumber/)
  assert.match(apiScript, /\/mini-app\/user\/phone-number/)
})
