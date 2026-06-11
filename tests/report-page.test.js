const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const reportTemplate = fs.readFileSync(path.join(projectRoot, 'pages/report/report.wxml'), 'utf8')
const reportStyle = fs.readFileSync(path.join(projectRoot, 'pages/report/report.wxss'), 'utf8')
const reportScript = fs.readFileSync(path.join(projectRoot, 'pages/report/report.js'), 'utf8')

test('report page keeps the mint hero card with mascot, stars, and metrics', () => {
  assert.match(reportTemplate, /class="hero"/)
  assert.match(reportTemplate, /本关学习报告/)
  assert.match(reportTemplate, /mascot-report-jelly\.png/)
  assert.match(reportTemplate, /stage-star-filled\.png/)
  assert.match(reportTemplate, /metric-acc/)
  assert.match(reportTemplate, /待复习的词/)
  assert.match(reportTemplate, /已掌握的词/)
})

test('report page uses the jelly report pill icon and home active task svg icons', () => {
  assert.match(reportTemplate, /icon-report-pill\.png/)
  assert.match(reportScript, /task-word-active\.svg/)
  assert.match(reportScript, /task-recitation-active\.svg/)
  assert.match(reportScript, /task-listening-active\.svg/)
})

test('report page bottom actions use black primary and light secondary pill styles', () => {
  assert.match(reportTemplate, /再练错词/)
  assert.match(reportTemplate, /返回学习/)
  assert.match(reportStyle, /\.action-btn-primary\s*{[^}]*background:\s*#111318/s)
  assert.match(reportStyle, /\.action-btn\s*{[^}]*border-radius:\s*999rpx/s)
})

test('report page mastered words use svg check badge instead of text tick', () => {
  assert.match(reportTemplate, /icon-word-mastered\.svg/)
  assert.doesNotMatch(reportTemplate, /status-ok">✓<\/view>/)
  assert.doesNotMatch(reportStyle, /\.status-ok::after/)
})
