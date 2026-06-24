const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const appConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'))
const todayTemplate = fs.readFileSync(path.join(projectRoot, 'pages/today/today.wxml'), 'utf8')
const todayStyle = fs.readFileSync(path.join(projectRoot, 'pages/today/today.wxss'), 'utf8')
const appStyle = fs.readFileSync(path.join(projectRoot, 'app.wxss'), 'utf8')
const todayScript = fs.readFileSync(path.join(projectRoot, 'pages/today/today.js'), 'utf8')

function loadTodayPage() {
  let pageConfig
  const storage = {}
  const calls = {
    navigateTo: [],
    showModal: []
  }
  const globalData = {
    book: { wordCount: 120 }
  }

  global.getApp = () => ({ globalData })
  global.wx = {
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = value },
    navigateTo: options => calls.navigateTo.push(options),
    showModal: options => calls.showModal.push(options),
    switchTab: () => {},
    showToast: () => {}
  }
  global.Page = config => {
    pageConfig = config
  }

  delete require.cache[require.resolve('../pages/today/today')]
  require('../pages/today/today')

  const page = Object.assign({}, pageConfig, {
    book: { wordCount: 120 },
    data: JSON.parse(JSON.stringify(pageConfig.data)),
    setData(update, callback) {
      Object.assign(this.data, update)
      if (typeof callback === 'function') {
        callback()
      }
    }
  })

  return { page, calls, storage }
}

function cssBlock(selector) {
  const pattern = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{[^}]*\\}')
  const match = todayStyle.match(pattern)
  return match ? match[0] : ''
}

function buildRouteUnit(sort, taskState = 'locked') {
  return {
    key: 'lv-' + sort,
    sort,
    unitId: 'unit-' + sort,
    title: '关卡 ' + sort + ' · 12词',
    levelWords: 12,
    tasks: [
      { type: 'word', label: '单词新学', current: 0, total: 12, percent: 0, mapState: taskState },
      { type: 'recitation', label: '跟读背诵', current: 0, total: 12, percent: 0, mapState: taskState },
      { type: 'listening', label: '关卡小测', current: 0, total: 12, percent: 0, mapState: taskState }
    ]
  }
}

test('app cold-starts on onboarding before tab pages', () => {
  assert.equal(appConfig.pages[0], 'pages/onboarding/onboarding')
  assert.ok(appConfig.pages.includes('pages/today/today'))
  assert.equal(appConfig.tabBar.list[0].pagePath, 'pages/today/today')
})

test('today page guards incomplete profiles on show', () => {
  assert.match(todayScript, /onReady\(\)\s*{[\s\S]*this\._todayReady\s*=\s*true/)
  assert.match(todayScript, /onShow\(\)\s*{[\s\S]*redirectToOnboardingIfNeeded\(\)/)
})

test('today dashboard prefers switched book before stale defaultBook', () => {
  assert.match(todayScript, /pendingBookId/)
  assert.match(todayScript, /pickActiveBook\(list, preferredResBookId\)/)
  assert.match(todayScript, /require\('\.\.\/\.\.\/utils\/book-select'\)/)
  assert.match(todayScript, /normalized\.resBookId !== prevId[\s\S]*this\.expandedKeys = \{\}/)
})

test('default book selection keeps proverbs dictionary before sync textbooks', () => {
  const { pickActiveBook, isProverbsDictionaryBook } = require('../utils/book-select')
  const books = [
    { resBookId: 'demo-pep-3a', name: '(新)三年级上册', press: '人教版PEP', needVip: 1 },
    { resBookId: 'dict-1', name: '初中英语词汇格言谚语词典', press: '商务印书馆', needVip: 1 },
    { resBookId: 'other-1', name: '其他词书', needVip: 0, unlocked: 1 }
  ]
  assert.equal(isProverbsDictionaryBook(books[1]), true)
  assert.equal(pickActiveBook(books).resBookId, 'dict-1')
  assert.equal(pickActiveBook(books, 'demo-pep-3a').resBookId, 'demo-pep-3a')
})

test('today overview shows learning stats and keeps plan editing beside the route', () => {
  assert.match(todayTemplate, /今日单词/)
  assert.match(todayTemplate, /今日句子/)
  assert.match(todayTemplate, /今日闯关/)
  assert.doesNotMatch(todayTemplate, /今日已通关/)
  assert.doesNotMatch(todayTemplate, /累计已学词/)
  assert.match(todayTemplate, /课本同步学/)
  assert.doesNotMatch(todayTemplate, /同步英语教材/)
  assert.doesNotMatch(todayTemplate, /ov-sync-tag/)
  assert.match(todayTemplate, /ov-sync-badge/)
  assert.match(todayTemplate, />同步2026新教材</)
  assert.doesNotMatch(todayTemplate, /我的教材/)
  assert.match(todayTemplate, /class="ov-book-body"/)
  assert.match(todayTemplate, /ov-book-cover-wrap/)
  assert.match(todayTemplate, /ov-book-cover-wrap[\s\S]*ov-book-switch inline-action" catchtap="switchBook"/)
  assert.match(todayTemplate, />更换教材</)
  assert.doesNotMatch(todayTemplate, />切换</)
  assert.match(todayTemplate, /wx:if="\{\{book\.newStandard\}\}" class="tag-new-standard ov-book-cover-tag"/)
  assert.match(todayTemplate, />新课标</)
  assert.match(todayTemplate, /toggleHighlights/)
  assert.match(todayTemplate, /展开/)
  assert.match(todayTemplate, /收起/)
  assert.match(todayTemplate, /ui-caret-down/)
  assert.match(todayTemplate, /ui-caret-up/)
  assert.match(todayTemplate, /ui-caret-right/)
  assert.doesNotMatch(todayTemplate, /⌄|⌃|切换 ›/)
  assert.doesNotMatch(todayTemplate, /听单词 · 跟读背诵 · AI打分 · 关卡小测/)
  assert.match(todayTemplate, /productHighlights/)
  assert.match(todayTemplate, /wx:if="\{\{highlightsExpanded\}\}" class="ov-highlight-list"/)
  assert.doesNotMatch(todayTemplate, /ov-highlight-hidden/)
  assert.match(todayTemplate, /icon-today-summary-jelly\.png/)
  assert.match(todayTemplate, /class="today-summary" bindtap="showTodayProgressHint"/)
  assert.match(todayTemplate, /class="summary-head-title">今日小结</)
  assert.match(todayTemplate, /今日学习路线/)
  assert.doesNotMatch(todayTemplate, /更新时间 \{\{routeUpdatedAtText\}\}/)
  assert.match(todayTemplate, /class="route-progress"/)
  assert.match(todayTemplate, /class="route-progress-fill" style="width: \{\{stepPercent\}\}%;"/)
  assert.match(todayTemplate, /\{\{doneSteps\}\}\/\{\{totalSteps\}\}/)
  assert.doesNotMatch(todayTemplate, /class="route-bar-row"/)
  assert.match(todayTemplate, /class="route-plan-btn" bindtap="adjustPlan"/)
  assert.match(todayTemplate, /调整学习计划/)
  assert.match(todayScript, /todaySentences/)
  assert.match(todayScript, /getTodayWords/)
  assert.match(todayScript, /PRODUCT_HIGHLIGHTS/)
  assert.match(todayScript, /听单词和例句/)
  assert.match(todayScript, /跟读背诵/)
  assert.match(todayScript, /单词新学/)
  assert.match(todayScript, /关卡小测/)
  assert.match(todayScript, /icon-today-feature-listen\.png/)
  assert.match(todayScript, /icon-today-feature-read\.png/)
  assert.match(todayScript, /icon-today-feature-recite\.png/)
  assert.match(todayScript, /icon-today-feature-quiz\.png/)
  assert.match(todayScript, /toggleHighlights/)
  assert.match(todayStyle, /\.summary-stats\s*{[\s\S]*gap:\s*14rpx/)
  assert.match(todayStyle, /\.inline-action\s*{[\s\S]*align-items:\s*center/)
  assert.match(appStyle, /\.ui-caret\s*{[\s\S]*border-right:\s*2rpx solid currentColor/)
  assert.doesNotMatch(todayStyle, /\.seg-fold-caret/)
  assert.match(todayStyle, /\.ov-sync-badge\s*{[\s\S]*#ff7a1a/)
  assert.match(todayStyle, /\.ov-book\s*{[\s\S]*flex-direction:\s*column/)
  assert.match(cssBlock('.ov-book-cover-tag'), /position:\s*absolute/)
  assert.match(cssBlock('.ov-book-cover-tag'), /top:\s*4rpx/)
  assert.match(cssBlock('.ov-book-switch'), /position:\s*absolute/)
  assert.match(cssBlock('.ov-book-switch'), /bottom:\s*0/)
  assert.match(cssBlock('.ov-book-switch'), /rgba\(17,\s*19,\s*24/)
  assert.match(cssBlock('.ov-book-switch'), /max-height:\s*25%/)
  assert.match(todayStyle, /\.ov-highlights\s*{[\s\S]*padding:\s*0 8rpx 6rpx/)
  assert.doesNotMatch(todayStyle, /\.ov-highlights-summary/)
  assert.doesNotMatch(todayStyle, /\.ov-highlight-hidden/)
  assert.match(todayStyle, /\.ov-highlight-icon\s*{/)
  assert.match(todayStyle, /\.summary-stat\s*{/)
  assert.match(todayStyle, /\.route-actions\s*{/)
  assert.match(todayStyle, /\.route-plan-btn\s*{/)
})

test('today stats cards show status-specific icon toast', () => {
  const { page, calls } = loadTodayPage()

  page.setData({ todayDone: 0, todayGoal: 3, allDone: false })
  page.showTodayProgressHint()
  assert.equal(page.data.monsterHint.visible, true)
  assert.equal(page.data.monsterHint.text, '今日计划已准备好，先从第 1 关开始吧')
  assert.equal(calls.navigateTo.length, 0)

  page.setData({ todayDone: 1, todayGoal: 3, allDone: false })
  page.showTodayProgressHint()
  assert.equal(page.data.monsterHint.text, '已完成 1/3 关，继续按计划推进')

  page.setData({ todayDone: 3, todayGoal: 3, allDone: true })
  page.showTodayProgressHint()
  assert.equal(page.data.monsterHint.text, '今日计划已完成，明天继续保持')
})

test('today plan button opens plan without progress toast', () => {
  const { page, calls } = loadTodayPage()

  page.setData({ monsterHint: { visible: false, text: '' }, todayDone: 1, todayGoal: 3, allDone: false })
  page.adjustPlan()

  assert.equal(page.data.monsterHint.visible, false)
  assert.equal(page.data.monsterHint.text, '')
  assert.equal(calls.navigateTo.length, 1)
  assert.match(calls.navigateTo[0].url, /\/pages\/plan\/plan\?wordCount=120/)
})

test('today plan button keeps a reliable tap target', () => {
  assert.match(todayStyle, /\.route-plan-btn\s*{[\s\S]*min-height:\s*64rpx/)
  assert.match(todayStyle, /\.route-plan-btn\s*{[\s\S]*padding:\s*0 22rpx 0 18rpx/)
})

test('non-member paid levels use the normal foldable route presentation', () => {
  const { page } = loadTodayPage()
  page.applyTargets(
    { resBookId: 'book-1', name: 'Book' },
    [
      buildRouteUnit(1, 'active'),
      buildRouteUnit(2, 'locked')
    ],
    2,
    0
  )

  const paidLevel = page.data.targetLevels[1]
  assert.equal(paidLevel.locked, false)
  assert.equal(paidLevel.requiresVip, true)
  assert.equal(paidLevel.levelState, 'upcoming')
  assert.equal(paidLevel.collapsible, true)
  assert.equal(paidLevel.expanded, false)
  assert.ok(paidLevel.tasks.every(task => task.stepState !== 'locked'))
})

test('non-member can expand a paid level but tapping a task prompts vip', () => {
  const { page, calls } = loadTodayPage()
  page.applyTargets(
    { resBookId: 'book-1', name: 'Book' },
    [
      buildRouteUnit(1, 'active'),
      buildRouteUnit(2, 'locked')
    ],
    2,
    0
  )

  page.toggleLevel({ currentTarget: { dataset: { key: 'lv-2' } } })
  assert.equal(page.data.targetLevels[1].expanded, true)
  assert.equal(calls.showModal.length, 0)

  ;['word', 'recitation', 'listening'].forEach(taskType => {
    page.tapTask({
      currentTarget: {
        dataset: {
          key: 'lv-2',
          taskType
        }
      }
    })
  })

  assert.equal(calls.showModal.length, 3)
  assert.equal(calls.navigateTo.length, 0)
})

test('vip member tapping the same later-level task follows normal navigation', () => {
  const { page, calls, storage } = loadTodayPage()
  storage.membership = { tierId: 'y1', expireAt: Date.now() + 86400000 }
  page.book = { resBookId: 'book-1', name: 'Book' }
  page.applyTargets(
    page.book,
    [
      buildRouteUnit(1, 'completed'),
      buildRouteUnit(2, 'active')
    ],
    2,
    1
  )

  page.tapTask({
    currentTarget: {
      dataset: {
        key: 'lv-2',
        taskType: 'word'
      }
    }
  })

  assert.equal(calls.showModal.length, 0)
  assert.equal(calls.navigateTo.length, 1)
  assert.match(calls.navigateTo[0].url, /unitId=unit-2/)
  assert.match(calls.navigateTo[0].url, /taskType=word/)
})

test('non-member tapping review level task prompts vip instead of finish previous', () => {
  const { page, calls } = loadTodayPage()
  page.applyTargets(
    { resBookId: 'book-1', name: 'Book' },
    [{
      key: 'review-1',
      sort: 3,
      isReview: true,
      locked: false,
      lockedByVip: false,
      title: '错词巩固 · 37词',
      levelWords: 37,
      reviewUnitIds: ['unit-1', 'unit-2', 'unit-3'],
      tasks: [
        { type: 'word', label: '错词重学', current: 0, total: 37, percent: 0, mapState: 'active' },
        { type: 'recitation', label: '错词跟读', current: 0, total: 37, percent: 0, mapState: 'upcoming' },
        { type: 'listening', label: '错词听力', current: 0, total: 37, percent: 0, mapState: 'upcoming' }
      ]
    }],
    1,
    0
  )

  page.tapTask({
    currentTarget: {
      dataset: {
        key: 'review-1',
        taskType: 'recitation'
      }
    }
  })

  assert.equal(calls.showModal.length, 1)
  assert.equal(calls.navigateTo.length, 0)
  assert.equal(page.data.monsterHint.visible, false)
})

test('today route does not render a separate member-only locked card', () => {
  assert.doesNotMatch(todayTemplate, /<block wx:if="\{\{level\.locked\}\}">/)
  assert.match(todayTemplate, /<block wx:if="\{\{level\.locked && level\.isReview\}\}">/)
  assert.match(todayTemplate, /class="locked-card"/)
})
