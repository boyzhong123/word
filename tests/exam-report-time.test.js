const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  getExam,
  scoreExam
} = require('../utils/exam-data')

const projectRoot = path.resolve(__dirname, '..')
const examPageScript = fs.readFileSync(path.join(projectRoot, 'pages/exam/exam.js'), 'utf8')
const examReportScript = fs.readFileSync(path.join(projectRoot, 'pages/exam/exam-report.js'), 'utf8')
const examReportTemplate = fs.readFileSync(path.join(projectRoot, 'pages/exam/exam-report.wxml'), 'utf8')
const examReportStyle = fs.readFileSync(path.join(projectRoot, 'pages/exam/exam-report.wxss'), 'utf8')

test('exam scoring stores compact practice time for the report', () => {
  const exam = getExam('book-1', 'entry')
  const result = scoreExam(exam, {}, { durationSeconds: 185 })

  assert.equal(result.practiceSeconds, 185)
  assert.equal(result.practiceTimeText, '4分')
})

test('exam page measures elapsed practice time from quiz start to submit', () => {
  assert.match(examPageScript, /this\.examStartedAt\s*=\s*Date\.now\(\)/)
  assert.match(examPageScript, /durationSeconds:\s*Math\.max\(/)
  assert.match(examPageScript, /scoreExam\(this\.exam,\s*this\.responses,\s*\{[\s\S]*durationSeconds/s)
})

test('exam report hero renders practice time beside score summary', () => {
  assert.match(examReportTemplate, /class="hero-facts"/)
  assert.match(examReportTemplate, /练习用时/)
  assert.match(examReportTemplate, /\{\{practiceTimeText\}\}/)
  assert.match(examReportStyle, /\.hero-facts\s*{/)
  assert.match(examReportStyle, /flex-direction:\s*row/)
  assert.match(examReportStyle, /\.hero-fact-value\s*{/)
})

test('exam report fills practice time for legacy cached results', () => {
  assert.match(examReportScript, /function fallbackPracticeTimeText/)
  assert.match(examReportScript, /const practiceTimeText = result\.practiceTimeText \|\| fallbackPracticeTimeText\(result\)/)
  assert.match(examReportScript, /practiceTimeText:\s*practiceTimeText/)
})

test('exam report uses shared copy rules from exam-report-copy', () => {
  assert.match(examReportScript, /require\('\.\.\/\.\.\/utils\/exam-report-copy'\)/)
  assert.match(examReportScript, /encourageText\(type, result\.accuracy, compareReady \? delta : null\)/)
})

test('exam report shows exact practice date time and keeps comment full width', () => {
  assert.match(examReportScript, /function formatPracticeDateTime/)
  assert.match(examReportScript, /practiceDateTimeText:\s*formatPracticeDateTime\(result\.ts\)/)
  assert.match(examReportTemplate, /练习时间/)
  assert.match(examReportTemplate, /\{\{practiceDateTimeText\}\}/)
  assert.match(examReportTemplate, /<\/view>\s*<view class="hero-facts"/)
  assert.match(examReportTemplate, /<\/view>\s*<view class="hero-encourage"/)
  assert.doesNotMatch(examReportStyle, /\.hero-content\s*{[^}]*width:\s*calc/s)
  assert.match(examReportStyle, /\.hero-encourage\s*{[^}]*width:\s*100%/s)
})
