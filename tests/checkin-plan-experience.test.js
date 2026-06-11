const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')

function readPage(page, ext) {
  return fs.readFileSync(path.join(projectRoot, 'pages', page, page + '.' + ext), 'utf8')
}

function readPageFile(pageDir, fileName) {
  return fs.readFileSync(path.join(projectRoot, 'pages', pageDir, fileName), 'utf8')
}

test('study plan page explains automatic check-in target and streak reward', () => {
  const template = readPage('plan', 'wxml')
  const style = readPage('plan', 'wxss')

  assert.match(template, /class="checkin-card"/)
  assert.match(template, /每天完成 <text class="hl">{{groupsPerDay}}<\/text> 关即打卡/)
  assert.match(template, /完成今日计划后，系统会自动点亮当天记录/)
  assert.match(template, /连续30天/)
  assert.match(template, /bolt-jelly\.png/)
  assert.match(template, /gift-jelly\.png/)
  assert.match(style, /\.checkin-card\s*{/)
  assert.match(style, /\.checkin-card-icon\s*{/)
  assert.match(style, /\.checkin-reward-pill\s*{/)
})

test('finish today page surfaces check-in success after reaching the daily goal', () => {
  const script = readPageFile('finish', 'today.js')
  const template = readPageFile('finish', 'today.wxml')
  const style = readPageFile('finish', 'today.wxss')

  assert.match(script, /getTodayDone/)
  assert.match(script, /getDailyGoal/)
  assert.match(script, /todayDoneBefore/)
  assert.match(script, /todayDoneAfter/)
  assert.match(script, /justCheckedIn/)
  assert.match(script, /checkinComplete/)
  assert.match(script, /goCheckinCalendar\(\)/)
  assert.match(script, /\/pages\/checkin\/calendar/)
  assert.match(template, /打卡成功/)
  assert.match(template, /今日已完成 {{todayDone}}\/{{todayGoal}} 关/)
  assert.match(template, /charge-jelly\.png/)
  assert.match(template, /bindtap="goCheckinCalendar"/)
  assert.match(style, /\.checkin-progress-line/)
  assert.match(style, /\.checkin-success-card/)
  assert.match(style, /\.checkin-calendar-btn/)
})
