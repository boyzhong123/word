const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const planScript = fs.readFileSync(path.join(projectRoot, 'pages/plan/plan.js'), 'utf8')
const homeScript = fs.readFileSync(path.join(projectRoot, 'pages/home/home.js'), 'utf8')
const todayScript = fs.readFileSync(path.join(projectRoot, 'pages/today/today.js'), 'utf8')

const {
  TODAY_FEEDBACK,
  queueTodayFeedback,
  consumeTodayFeedback
} = require('../utils/today-feedback')

test('today feedback is queued and consumed only once', () => {
  const globalData = {}

  queueTodayFeedback(globalData, TODAY_FEEDBACK.PLAN_UPDATED)

  assert.deepEqual(consumeTodayFeedback(globalData), {
    title: '新的学习计划已生成',
    icon: 'none'
  })
  assert.equal(consumeTodayFeedback(globalData), null)
})

test('book change uses its own generated-plan feedback', () => {
  const globalData = {}

  queueTodayFeedback(globalData, TODAY_FEEDBACK.BOOK_CHANGED)

  assert.deepEqual(consumeTodayFeedback(globalData), {
    title: '新教材学习计划已生成',
    icon: 'none'
  })
})

test('plan save queues feedback for the today page before navigating back', () => {
  assert.match(planScript, /queueTodayFeedback\(getApp\(\)\.globalData,\s*TODAY_FEEDBACK\.PLAN_UPDATED\)/)
  assert.match(planScript, /queueTodayFeedback[\s\S]*wx\.navigateBack\(\)/)
})

test('book switch queues feedback only on the return-to-today path', () => {
  assert.match(
    homeScript,
    /if \(this\.returnToTodayAfterBookSwitch\) \{[\s\S]*TODAY_FEEDBACK\.BOOK_CHANGED[\s\S]*wx\.switchTab\(\{ url: '\/pages\/today\/today' \}\)/
  )
})

test('today page consumes pending feedback and displays its toast on show', () => {
  assert.match(todayScript, /onShow\(\)[\s\S]*consumeTodayFeedback\(globalData\)/)
  assert.match(todayScript, /wx\.showToast\(feedback\)/)
})
