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
  assert.deepEqual(days.slice(0, 7).map(day => day.day), [1, 2, 3, 4, 5, 6, 7])
  assert.equal(days[0].inMonth, true)
  assert.equal(days[0].date, '2026-06-01')
  assert.equal(days[0].checked, true)
  assert.equal(days[1].checked, false)
  assert.equal(days[4].isToday, true)
  assert.equal(days.filter(day => day.inMonth).length, 30)
  assert.deepEqual(days.slice(-5).map(day => day.inMonth), [false, false, false, false, false])

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
  assert.match(template, /day-cell-unchecked/)
  assert.match(template, /day-reward-badge/)
  assert.match(template, /day-cell-reward/)
  assert.match(template, /gift-jelly\.png/)
  assert.match(template, /charge-jelly\.png/)
  assert.match(template, /bolt-jelly\.png/)
  assert.match(template, /help-jelly\.png/)
  assert.match(template, /gift-day-jelly\.png/)
  assert.match(template, /bindtap="openGiftDialog"/)
  assert.match(template, /bindtap="copyRewardCode"/)
  assert.match(template, /navActionsRight/)
  assert.match(style, /\.nav-btn\s*{[^}]*margin-left:\s*8rpx/s)
  assert.match(style, /\.nav-btn\s*{[^}]*min-width:\s*64rpx/s)
  assert.match(style, /\.nav-btn\s*{[^}]*padding:\s*0 8rpx/s)
  assert.match(style, /\.power-card/)
  assert.match(style, /\.calendar-card/)
  assert.match(style, /\.day-cell-checked\s*{/)
  assert.match(style, /\.day-cell-unchecked\s*{/)
  assert.match(style, /\.day-cell-today\s*{/)
  assert.match(style, /\.day-reward-badge\s*{/)
  assert.match(style, /\.gift-dialog/)
})

test('check-in calendar unlocks gift reward after 30 continuous days', () => {
  const calendarScript = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.js'),
    'utf8'
  )

  assert.match(calendarScript, /STREAK_REWARD_DAYS = 30/)
  assert.match(calendarScript, /giftUnlocked: displayContinuousDays >= STREAK_REWARD_DAYS/)
  assert.match(calendarScript, /setClipboardData/)
})

test('check-in calendar exposes rule dialog from the help icon', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.wxml'),
    'utf8'
  )
  const style = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.wxss'),
    'utf8'
  )
  const calendarScript = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.js'),
    'utf8'
  )

  assert.match(template, /class="help-icon"[^>]*bindtap="openRulesDialog"/)
  assert.match(template, /wx:if="{{showRulesDialog}}"/)
  assert.match(template, /完成今日计划关卡/)
  assert.match(template, /连续30天/)
  assert.match(template, /bindtap="closeRulesDialog"/)
  assert.match(calendarScript, /showRulesDialog:\s*false/)
  assert.match(calendarScript, /openRulesDialog\(\)/)
  assert.match(calendarScript, /closeRulesDialog\(\)/)
  assert.match(style, /\.rules-dialog-mask/)
  assert.match(style, /\.rules-dialog/)
})

test('check-in calendar gift dialog has locked remaining and copied states', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.wxml'),
    'utf8'
  )
  const style = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.wxss'),
    'utf8'
  )
  const calendarScript = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.js'),
    'utf8'
  )

  assert.match(template, /giftCopied \? '已复制' : '复制兑换码'/)
  assert.match(template, /gift-dialog-copy-done/)
  assert.match(template, /wx:if="{{giftUnlocked}}"/)
  assert.match(template, /rewardProgressPercent/)
  assert.match(template, /还差 {{rewardRemainingDays}} 天/)
  assert.match(calendarScript, /giftCopied:\s*false/)
  assert.match(calendarScript, /rewardRemainingDays:/)
  assert.match(calendarScript, /getRewardRemainingDays\(displayContinuousDays\)/)
  assert.match(calendarScript, /this\.setData\(\{\s*showGiftDialog:\s*true,\s*giftCopied:\s*false\s*\}\)/)
  assert.match(calendarScript, /fail:\s*\(\)\s*=>/)
  assert.match(style, /\.gift-dialog-copy-done/)
  assert.match(style, /\.gift-progress-track/)
  assert.match(style, /\.gift-progress-fill/)
})

test('check-in calendar shares today and streak posters', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.wxml'),
    'utf8'
  )
  const style = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.wxss'),
    'utf8'
  )
  const calendarScript = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.js'),
    'utf8'
  )
  const {
    APP_NAME,
    buildPosterText,
    formatPosterDate,
    getDailyQuote,
    POSTER_WIDTH,
    POSTER_HEIGHT,
    getPosterBackgroundSrc
  } = require('../pages/checkin/share-poster')

  // 入口与浮层结构
  assert.match(template, /bindtap="openShareDialog"/)
  assert.match(template, /wx:if="{{showShareDialog}}"/)
  assert.match(template, /data-mode="today"/)
  assert.match(template, /data-mode="streak"/)
  assert.match(template, /bindtap="switchShareMode"/)
  assert.match(template, /bindchange="onShareThemeSwipe"/)
  assert.match(template, /class="share-poster-swiper"/)
  assert.match(style, /\.share-theme-dot/)
  assert.match(template, /bindtap="saveShareImage"/)
  assert.match(template, /bindtap="sendShareImage"/)
  assert.match(template, /id="share-poster" type="2d"/)
  assert.match(style, /\.share-poster-canvas/)
  assert.match(style, /\.share-action-save/)
  assert.match(style, /\.share-action-send/)

  // 导出 / 保存 / 分享走对应的小程序 API
  assert.match(calendarScript, /wx\.canvasToTempFilePath\(\{\s*canvas/)
  assert.match(calendarScript, /ensurePhotosAlbumPermission/)
  assert.match(calendarScript, /wx\.getSetting/)
  assert.match(calendarScript, /wx\.authorize\(\{\s*scope:\s*'scope\.writePhotosAlbum'/)
  assert.match(calendarScript, /wx\.openSetting/)
  assert.match(calendarScript, /wx\.saveImageToPhotosAlbum/)
  assert.match(calendarScript, /wx\.showShareImageMenu/)
  assert.match(calendarScript, /SHARE_BADGE_SRC = '\/images\/home\/icon-book-picker-jelly\.png'/)

  // 海报文案：两种模式共用数据列，标题不同
  assert.equal(APP_NAME, '词句刷刷刷')
  const today = new Date(2026, 5, 12)
  assert.equal(formatPosterDate(today), '2026.06.12')
  const quote = getDailyQuote(today)
  assert.ok(quote.en && quote.cn)
  assert.deepEqual(getDailyQuote(today), quote, 'same day keeps the same quote')

  const streak = buildPosterText({ mode: 'streak', continuousDays: 34, totalDays: 43, todayDone: 2, learnedWords: 1413 })
  assert.match(streak.headline[1], /已连续打卡学习 34 天/)
  assert.deepEqual(streak.stats.map(item => item.value), [1413, 43, 34])
  const todayText = buildPosterText({ mode: 'today', continuousDays: 34, totalDays: 43, todayDone: 2, todayWords: 60 })
  assert.match(todayText.headline[1], /今天学了 60 个单词/)
  assert.deepEqual(todayText.stats.map(item => item.value), [60, 2, 34])

  assert.equal(POSTER_WIDTH, 600)
  assert.equal(POSTER_HEIGHT, 960)
  assert.match(getPosterBackgroundSrc('today', 'monster'), /share-bg-today-monster\.png/)
  assert.match(getPosterBackgroundSrc('streak', 'pk'), /share-bg-streak-pk\.png/)
})

test('check-in calendar falls back to demo data when API has no records', () => {
  const calendarScript = fs.readFileSync(
    path.join(projectRoot, 'pages/checkin/calendar.js'),
    'utf8'
  )
  const {
    DEMO_CONTINUOUS_DAYS,
    buildDemoCheckedDates,
    formatDate
  } = require('../pages/checkin/calendar-data')

  assert.match(calendarScript, /buildDemoCheckedDates\(this\.today\)/)
  assert.match(calendarScript, /continuousDays = DEMO_CONTINUOUS_DAYS/)
  assert.match(homeScript, /buildDemoCheckinMetrics\(\)/)

  const today = new Date(2026, 5, 12)
  const dates = buildDemoCheckedDates(today)
  assert.ok(DEMO_CONTINUOUS_DAYS >= 30, 'demo streak unlocks the gift reward')
  assert.equal(new Set(dates).size, dates.length, 'demo dates are unique')
  assert.equal(dates[0], formatDate(today), 'demo streak ends today')
  assert.ok(dates.length > DEMO_CONTINUOUS_DAYS, 'demo data includes earlier scattered days')
})
