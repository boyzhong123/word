const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')

test('study record helpers summarize a hotel-style selected date range', () => {
  const {
    buildDemoStudyRecords,
    buildRecentDays,
    buildStudyCalendarDays,
    getRecordsInRange,
    normalizeRange,
    summarizeStudyRecords
  } = require('../utils/study-records')

  const today = new Date(2026, 5, 12)
  const records = buildDemoStudyRecords(today)
  const range = normalizeRange('2026-06-05', '2026-06-02')
  const selectedRecords = getRecordsInRange(records, range.startDate, range.endDate)
  const summary = summarizeStudyRecords(selectedRecords)

  assert.deepEqual(range, {
    startDate: '2026-06-02',
    endDate: '2026-06-05'
  })
  assert.equal(selectedRecords.length, 4)
  assert.equal(summary.studyDays, 4)
  assert.equal(summary.minutes, 126)
  assert.equal(summary.newWords, 66)
  assert.equal(summary.readWords, 82)
  assert.equal(summary.readSentences, 21)
  assert.equal(summary.quizWords, 66)
  assert.equal(summary.reciteWords, 36)
  assert.equal(summary.reviewWords, 9)
  assert.equal(summary.audioMinutes, 28)
  assert.equal(summary.practiceCount, 205)

  const recentDays = buildRecentDays(today, records, range.startDate, range.endDate)
  assert.deepEqual(recentDays.map(day => day.day), [6, 7, 8, 9, 10, 11, 12])
  assert.equal(recentDays[0].minutes, 29)
  assert.equal(recentDays[0].inRange, false)
  assert.equal(recentDays[6].date, '2026-06-12')

  const calendarDays = buildStudyCalendarDays(new Date(2026, 5, 1), records, range.startDate, range.endDate)
  const juneFive = calendarDays.find(day => day.date === '2026-06-05')
  assert.equal(calendarDays.length, 35)
  assert.equal(juneFive.inMonth, true)
  assert.equal(juneFive.hasRecord, true)
  assert.equal(juneFive.inRange, true)
  assert.equal(juneFive.isRangeEnd, true)
  assert.equal(juneFive.minutes, 38)
})

test('study record page is registered and reachable from the Me stats card', () => {
  const appConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'))
  const meTemplate = fs.readFileSync(path.join(projectRoot, 'pages/me/me.wxml'), 'utf8')
  const meScript = fs.readFileSync(path.join(projectRoot, 'pages/me/me.js'), 'utf8')
  const recordTemplate = fs.readFileSync(path.join(projectRoot, 'pages/study-record/record.wxml'), 'utf8')
  const recordScript = fs.readFileSync(path.join(projectRoot, 'pages/study-record/record.js'), 'utf8')
  const recordStyle = fs.readFileSync(path.join(projectRoot, 'pages/study-record/record.wxss'), 'utf8')

  assert.ok(appConfig.pages.includes('pages/study-record/record'))
  assert.match(meTemplate, /class="stats-card[^"]*stats-card-clickable[^"]*"/)
  assert.match(meTemplate, /data-url="\/pages\/study-record\/record"/)
  assert.match(meTemplate, /bindtap="handleMenuTap"/)
  assert.match(meScript, /goStudyRecord\(\)/)
  assert.match(meScript, /\/pages\/study-record\/record/)

  assert.match(recordTemplate, /学习记录/)
  assert.match(recordTemplate, /选择学习周期/)
  assert.match(recordTemplate, /'收起' : '展开'/)
  assert.match(recordTemplate, /周期汇总/)
  assert.match(recordTemplate, /每天记录/)
  assert.match(recordScript, /新学单词/)
  assert.match(recordScript, /跟读单词/)
  assert.match(recordScript, /跟读句子/)
  assert.match(recordScript, /小测单词/)
  assert.match(recordScript, /背诵单词/)
  assert.match(recordScript, /听力音频/)
  assert.doesNotMatch(recordTemplate, /成绩|分数|正确率/)
  assert.match(recordScript, /selectPreset\(event\)/)
  assert.match(recordScript, /selectCalendarDate\(event\)/)
  assert.match(recordScript, /toggleRecordDay\(event\)/)
  assert.match(recordScript, /applyRange\(startDate, endDate/)
  assert.match(recordStyle, /\.range-hero/)
  assert.match(recordStyle, /\.calendar-range-band/)
  assert.match(recordStyle, /\.calendar-cell-edge/)
  assert.match(recordStyle, /\.record-day-open/)
  assert.match(recordStyle, /\.summary-icon-box/)
  assert.match(recordStyle, /\.recent-cell-edge/)
  assert.match(recordTemplate, /summaryItems/)
  assert.match(recordTemplate, /heroMascot/)
})
