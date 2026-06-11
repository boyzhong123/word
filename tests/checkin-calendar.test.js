const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const appConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'))
const homeTemplate = fs.readFileSync(path.join(projectRoot, 'pages/home/home.wxml'), 'utf8')
const homeScript = fs.readFileSync(path.join(projectRoot, 'pages/home/home.js'), 'utf8')

test('home book card places check-in calendar in the title row', () => {
  assert.doesNotMatch(homeTemplate, /message-action\.png/)
  assert.doesNotMatch(homeTemplate, /calendar-action\.png/)
  assert.doesNotMatch(homeTemplate, /hero-calendar-action/)
  assert.match(homeTemplate, /icon-checkin-calendar-jelly\.png/)
  assert.match(homeTemplate, /icon-checkin-streak-jelly\.png/)
  assert.match(homeTemplate, /icon-checkin-total-jelly\.png/)
  assert.match(homeTemplate, /icon-checkin-today-jelly\.png/)
  assert.match(homeTemplate, /class="checkin-calendar-button" bindtap="goCheckinCalendar"/)
  assert.match(homeTemplate, /bindtap="goCheckinCalendar"/)
  assert.match(homeTemplate, /class="switch-book switch-book-cover" bindtap="switchBook"/)
  assert.match(homeScript, /goCheckinCalendar\(\)/)
  assert.match(homeScript, /\/pages\/checkin\/calendar/)
})

test('app registers the check-in calendar page', () => {
  assert.ok(appConfig.pages.includes('pages/checkin/calendar'))
})

test('check-in calendar helper builds a month grid with checked and today states', () => {
  const {
    buildCalendarDays,
    buildCheckinSummary
  } = require('../pages/checkin/calendar-data')

  const days = buildCalendarDays(new Date(2026, 5, 5), [
    '2026-06-01',
    '2026-06-03',
    '2026-06-05'
  ], new Date(2026, 5, 5))

  assert.equal(days.length, 35)
  assert.deepEqual(days.slice(0, 7).map(day => day.day), [31, 1, 2, 3, 4, 5, 6])
  assert.equal(days[0].inMonth, false)
  assert.equal(days[1].date, '2026-06-01')
  assert.equal(days[1].checked, true)
  assert.equal(days[2].checked, false)
  assert.equal(days[5].isToday, true)
  assert.equal(days.filter(day => day.inMonth).length, 30)
  assert.deepEqual(days.slice(-5).map(day => day.inMonth), [true, false, false, false, false])

  const summary = buildCheckinSummary(days)
  assert.equal(summary.checkedDays, 3)
  assert.equal(summary.monthDays, 30)
  assert.equal(summary.progressPercent, 10)
})

test('check-in calendar page renders summary, weekday headers, and day cells', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.wxml'),
    'utf8'
  )
  const style = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.wxss'),
    'utf8'
  )

  assert.doesNotMatch(template, /打卡日历/)
  assert.match(template, /连续不断电/)
  assert.match(template, /开始背单词/)
  assert.match(template, /bindtap="startLearning"/)
  assert.match(template, /bindtap="prevMonth"/)
  assert.match(template, /bindtap="nextMonth"/)
  assert.match(template, /wx:for="{{weekdays}}"/)
  assert.match(template, /wx:for="{{calendarDays}}"/)
  assert.match(template, /class="day-cell/)
  assert.match(template, /day-cell-reward/)
  assert.match(template, /gift-jelly\.png/)
  assert.match(template, /charge-jelly\.png/)
  assert.match(template, /bolt-jelly\.png/)
  assert.match(template, /gift-day-jelly\.png/)
  assert.match(template, /bindtap="openGiftDialog"/)
  assert.match(template, /bindtap="copyRewardCode"/)
  assert.match(template, /navActionsRight/)
  assert.match(style, /\.power-card/)
  assert.match(style, /\.calendar-card/)
  assert.match(style, /\.day-cell-checked\s*{/)
  assert.match(style, /\.day-cell-today\s*{/)
  assert.match(style, /\.gift-dialog/)
})

test('check-in calendar unlocks gift reward after 30 continuous days', () => {
  const calendarScript = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.js'),
    'utf8'
  )

  assert.match(calendarScript, /STREAK_REWARD_DAYS = 30/)
  assert.match(calendarScript, /giftUnlocked: continuousDays >= STREAK_REWARD_DAYS/)
  assert.match(calendarScript, /setClipboardData/)
})
