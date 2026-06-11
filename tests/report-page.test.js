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

test('report page uses the jelly report pill icon and task png icons', () => {
  assert.match(reportTemplate, /icon-report-pill\.png/)
  assert.match(reportScript, /task-word\.png/)
  assert.match(reportScript, /task-recitation\.png/)
  assert.match(reportScript, /task-listening\.png/)
})

test('report page bottom actions use the green primary and outlined ghost styles', () => {
  assert.match(reportTemplate, /再练错词/)
  assert.match(reportTemplate, /返回学习/)
  assert.match(reportStyle, /\.action-btn-primary\s*{[^}]*background:\s*#22c55e/s)
  assert.match(reportStyle, /\.action-btn-ghost\s*{[^}]*border:\s*2rpx solid #22c55e/s)
})
