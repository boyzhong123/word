const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const homeScript = fs.readFileSync(path.join(projectRoot, 'pages/home/home.js'), 'utf8')
const homeTemplate = fs.readFileSync(path.join(projectRoot, 'pages/home/home.wxml'), 'utf8')
const homeStyle = fs.readFileSync(path.join(projectRoot, 'pages/home/home.wxss'), 'utf8')
const frameAnimationStyle = fs.readFileSync(
  path.join(projectRoot, 'components/frame-animation/frame-animation.wxss'),
  'utf8'
)

function loadHomePage() {
  let pageConfig
  const calls = {
    navigateTo: [],
    showToast: []
  }

  global.getApp = () => ({
    globalData: {
      BASE_URL: 'https://example.test',
      token: ''
    }
  })
  const storage = {}
  global.wx = {
    getSystemInfoSync: () => ({
      windowHeight: 800,
      safeArea: { bottom: 780 }
    }),
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = value },
    navigateTo: options => calls.navigateTo.push(options),
    showToast: options => calls.showToast.push(options),
    hideTabBar: () => {},
    showTabBar: () => {},
    createSelectorQuery: () => ({
      select() { return this },
      boundingClientRect(callback) {
        this._callback = callback
        return this
      },
      exec(callback) {
        const results = [
          { bottom: 120 },
          { top: 0 }
        ]
        if (typeof this._callback === 'function') {
          this._callback(results[0])
        }
        if (typeof callback === 'function') {
          callback(results)
        }
      }
    })
  }
  global.Page = config => {
    pageConfig = config
  }

  delete require.cache[require.resolve('../pages/home/home')]
  require('../pages/home/home')

  const page = Object.assign({}, pageConfig, {
    data: JSON.parse(JSON.stringify(pageConfig.data)),
    setData(update) {
      Object.assign(this.data, update)
    }
  })

  return { page, calls }
}

test('home hero uses the jelly campus header with safe-zone positioning', () => {
  const heroPath = path.join(projectRoot, 'images/home/hero-campus-jelly-v5.png')
  assert.ok(fs.existsSync(heroPath))
  assert.match(homeTemplate, /hero-campus-jelly-v5\.png/)
  assert.match(homeTemplate, /class="hero-image"[^>]*mode="widthFix"/)
  assert.match(homeStyle, /\.hero-image\s*{[^}]*width:\s*100%/s)
  assert.match(homeStyle, /\.hero-image\s*{[^}]*max-width:\s*100%/s)
})

test('home scroll view uses explicit viewport height and tab-bar spacer', () => {
  assert.match(homeTemplate, /style="height: {{scrollViewHeight}}px;"/)
  assert.match(homeTemplate, /style="height: {{scrollSpacerRpx}}rpx;"/)
  assert.match(homeScript, /scrollViewHeight:\s*windowHeight/)
  assert.match(homeScript, /scrollSpacerRpx:/)
  assert.doesNotMatch(homeStyle, /\.scroll-spacer\s*{[^}]*height:\s*112rpx/s)
})

test('home page uses the shared unit mapper and maintains a visible batch', () => {
  assert.match(homeScript, /require\('\.\/home-units'\)/)
  assert.match(homeScript, /resetVisibleUnits\(apiUnits\)/)
  assert.match(homeScript, /getNextVisibleCount/)
  assert.match(homeScript, /loadMoreUnits\(\)/)
})

test('home scroll view loads another batch when reaching the bottom', () => {
  assert.match(homeTemplate, /bindscrolltolower="loadMoreUnits"/)
})

test('home page exposes a floating button to jump back to today tasks', () => {
  assert.match(homeTemplate, /id="today-group"/)
  assert.match(homeTemplate, /today-scroll-target/)
  assert.match(homeTemplate, /class="today-locate-fab"/)
  assert.match(homeTemplate, /bindtap="scrollToTodayTasks"/)
  assert.match(homeTemplate, /showTodayLocateFab/)
  assert.match(homeTemplate, /fab-today-locate-jelly\.png/)
  assert.match(homeScript, /scrollToTodayTasks\(\)/)
  assert.match(homeScript, /updateTodayLocateFab\(\)/)
  assert.match(homeScript, /computeScrollTopToCenterTarget/)
  assert.match(homeScript, /scrollNode\.scrollTo/)
  assert.match(homeStyle, /\.today-locate-fab\s*{/)
  assert.match(homeStyle, /\.today-locate-fab-image\s*{[^}]*width:\s*106rpx/s)
  assert.doesNotMatch(homeTemplate, /scroll-into-view="{{scrollIntoId}}"/)

  const fabPath = path.join(projectRoot, 'images/home/fab-today-locate-jelly.png')
  assert.ok(fs.existsSync(fabPath))
  const header = fs.readFileSync(fabPath)
  assert.equal(header.toString('ascii', 1, 4), 'PNG')
  assert.ok(header.readUInt32BE(16) >= 320, 'today locate fab should be a full button asset')
})

test('today locate scroll centers the target card in the scroll viewport', () => {
  const { computeScrollTopToCenterTarget } = require('../pages/home/home-scroll.js')

  assert.equal(
    computeScrollTopToCenterTarget(500, { top: 200, height: 232 }, { top: 100, height: 800 }),
    316
  )
  assert.equal(
    computeScrollTopToCenterTarget(100, { top: 384, height: 232 }, { top: 100, height: 800 }),
    100
  )
  assert.equal(computeScrollTopToCenterTarget(0, null, { top: 0, height: 800 }), null)
})

test('unit cards keep their height but balance the inner whitespace', () => {
  assert.match(homeStyle, /\.unit-card\s*{[^}]*height:\s*232rpx/s)
  assert.match(homeStyle, /\.unit-card\s*{[^}]*padding:\s*20rpx 19rpx;/s)
  assert.match(homeStyle, /\.unit-top\s*{[^}]*height:\s*92rpx/s)
  assert.match(homeStyle, /\.task-card\s*{[^}]*height:\s*100rpx/s)
})

test('today check-in levels are wrapped in one box, styled apart from review', () => {
  // Rendered from grouped data, with a「今日要学」header carrying the goal count
  assert.match(homeTemplate, /wx:for="{{listGroups}}"/)
  assert.match(homeTemplate, /group\.today/)
  assert.match(homeTemplate, /class="today-group"/)
  assert.match(homeTemplate, /今日要学/)
  assert.match(homeTemplate, /{{checkin\.todayDone}}\/{{checkin\.todayGoal}} 关/)
  // The box has its own styling, distinct from the orange review card
  assert.match(homeStyle, /\.today-group\s*{/)
  assert.doesNotMatch(homeTemplate, /unit-card-today/)
})

test('completed unit cards expose a report pill that opens the report page', () => {
  assert.match(homeTemplate, /class="unit-report-pill"/)
  assert.match(homeTemplate, /icon-report-pill\.png/)
  assert.match(homeTemplate, /catchtap="goUnitReport"/)
  assert.match(homeTemplate, /unit\.doneStages >= 3/)
  assert.match(homeScript, /goUnitReport\(event\)/)
  assert.match(homeScript, /\/pages\/report\/report\?/)
  assert.match(homeStyle, /\.unit-report-pill\s*{/)
})

test('unit stage progress renders three imagegen stars instead of a numeric fraction', () => {
  assert.match(homeTemplate, /class="unit-stage-stars"/)
  assert.match(homeTemplate, /wx:for="{{unit\.stageStars}}"/)
  assert.match(homeTemplate, /stage-star-filled\.png/)
  assert.match(homeTemplate, /stage-star-empty\.png/)
  assert.doesNotMatch(homeTemplate, /{{unit\.doneStages}}\/3/)
  assert.match(homeTemplate, /class="unit-heading-row"[\s\S]*class="unit-title"[\s\S]*class="unit-stage-stars"/)
  assert.match(homeStyle, /\.unit-heading-row\s*{[^}]*display:\s*flex/s)
  assert.doesNotMatch(homeStyle, /\.unit-stage-stars\s*{[^}]*position:\s*absolute/s)
  assert.match(homeStyle, /\.unit-stage-star\s*{[^}]*width:\s*30rpx/s)
})

test('unit subtitles default to English and render a bilingual toggle', () => {
  assert.doesNotMatch(homeScript, /^\s*subtitleLanguage:\s*'en'/m)
  assert.match(homeScript, /toggleSubtitleLanguage\(event\)/)
  assert.match(homeTemplate, /class="unit-subtitle-row"/)
  assert.match(homeTemplate, /unit\.subtitleEnglish/)
  assert.match(homeTemplate, /unit\.subtitleChinese/)
  assert.match(homeTemplate, /catchtap="toggleSubtitleLanguage"/)
  // Grouped rendering carries each unit's original list index for handlers
  assert.match(homeTemplate, /data-unit-index="{{unit\.listIndex}}"/)
  assert.match(homeTemplate, /unit\.subtitleLanguage === 'en' \? '中' : 'EN'/)
  assert.match(homeStyle, /\.unit-subtitle\s*{[^}]*flex:\s*0 1 auto/s)
  assert.doesNotMatch(homeStyle, /\.unit-subtitle\s*{[^}]*flex:\s*1/s)
  assert.match(homeStyle, /\.subtitle-language-toggle\s*{/)
})

test('home page keeps category cards visible while the map entry is hidden', () => {
  const { page } = loadHomePage()

  assert.equal(page.data.levelViewMode, 'category')

  assert.match(homeTemplate, /levelViewMode === 'category'/)
  assert.match(homeTemplate, /class="map-trail"/)
  assert.match(homeTemplate, /class="trail-node trail-node-{{stop\.state}}"/)
  assert.match(homeTemplate, /bindtap="handleTaskTap"/)
  assert.match(homeTemplate, /stop\.monsterSprite/)
  assert.doesNotMatch(homeTemplate, /bindtap="toggleLevelView"/)
  assert.doesNotMatch(homeTemplate, /view-mode-fab/)
})

test('map path renders a continuous task trail with animated monsters', () => {
  assert.match(homeTemplate, /wx:for="{{mapTrail}}"/)
  assert.match(homeTemplate, /class="trail-connector trail-connector-{{stop\.connector\.state}}"/)
  assert.match(homeTemplate, /class="trail-node-coin"/)
  assert.match(homeTemplate, /class="trail-monster trail-monster-{{stop\.monsterState}}"/)
  assert.match(homeTemplate, /url="{{stop\.monsterSprite}}"/)
})

test('unit monster state maps to defeated, fighting pk, or sleeping locked sprites', () => {
  const { buildDisplayUnits } = require('../pages/home/home-units')
  const units = buildDisplayUnits([
    { unitId: 'done', sort: 1, wordTotal: 12, completed: true },
    { unitId: 'current', sort: 2, wordTotal: 12 },
    { unitId: 'future', sort: 3, wordTotal: 12 }
  ])

  assert.deepEqual(units.map(unit => unit.cardMonsterState), [
    'defeated',
    'fighting',
    'locked'
  ])
  assert.match(homeTemplate, /cardMonsterState === 'fighting'[\s\S]*student-monster-pk-sprite\.png/)
})

test('fighting PK sprite fits inside the unit card header without overflowing', () => {
  assert.match(homeStyle, /\.unit-card\s*{[^}]*overflow:\s*hidden/s)
  assert.match(homeStyle, /\.unit-top\s*{[^}]*overflow:\s*hidden/s)
  assert.match(homeStyle, /\.unit-card-monster-fighting\s*{[^}]*width:\s*148rpx/s)
  assert.match(homeStyle, /\.unit-card-monster-fighting\s*{[^}]*height:\s*84rpx/s)
  assert.match(homeTemplate, /cardMonsterState === 'fighting'[\s\S]*width="148"[\s\S]*height="84"/)
})

test('category cards render state-specific jelly monster sprites', () => {
  assert.match(homeTemplate, /<frame-animation/)
  assert.match(homeTemplate, /class="unit-card-monster unit-card-monster-{{unit\.cardMonsterState}}"/)
  assert.match(homeTemplate, /cardMonsterState === 'fighting'/)
  assert.match(homeTemplate, /url="{{unit\.cardMonsterSprite}}"/)
  assert.match(homeTemplate, /count="{{unit\.cardMonsterFrameCount}}"/)
  assert.match(homeTemplate, /width="{{unit\.cardMonsterFrameSize}}"/)
  assert.match(homeTemplate, /height="{{unit\.cardMonsterFrameSize}}"/)
  assert.match(homeTemplate, /duration="{{unit\.cardMonsterDuration}}"/)
  assert.match(homeTemplate, /state="{{unit\.cardMonsterState === 'fighting' \? 'running' : 'paused'}}"/)
  assert.match(homeStyle, /\.unit-card-monster\s*{/)
  assert.match(homeStyle, /\.unit-card-monster-locked\s*{/)
})

test('frame animation advances sprite frames with js timing for mini program playback', () => {
  const frameAnimationScript = fs.readFileSync(
    path.join(projectRoot, 'components/frame-animation/frame-animation.js'),
    'utf8'
  )
  assert.match(frameAnimationScript, /buildFrameStyle\(frameIndex\)/)
  assert.match(frameAnimationScript, /background-position:/)
  assert.match(frameAnimationScript, /setInterval\(/)
  assert.match(frameAnimationScript, /this\.properties\.url/)
  assert.match(frameAnimationScript, /value:\s*'paused'/)
  assert.match(frameAnimationScript, /syncAnimationState\(state\)/)
  assert.match(frameAnimationScript, /observers:\s*{\s*state\(state\)/)
})

test('home page blocks recitation navigation for locked units', () => {
  assert.match(homeScript, /if \(unit\.locked\)/)
  assert.match(homeScript, /title: '开通会员后解锁'/)
})

test('home page renders 20 units initially and appends the remaining batches', () => {
  const { page } = loadHomePage()
  const units = Array.from({ length: 45 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 12
  }))

  page.resetVisibleUnits(units)
  assert.equal(page.allUnits.length, 45)
  assert.equal(page.data.units.length, 20)

  page.loadMoreUnits()
  assert.equal(page.data.units.length, 40)

  page.loadMoreUnits()
  assert.equal(page.data.units.length, 45)
})

test('subtitle language toggle switches only the selected unit', () => {
  const { page } = loadHomePage()
  page.resetVisibleUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 12 },
    { unitId: 'unit-2', sort: 2, wordTotal: 12 }
  ])

  assert.deepEqual(page.data.listUnits.map(unit => unit.subtitleLanguage), ['en', 'en'])
  page.toggleSubtitleLanguage({ currentTarget: { dataset: { unitIndex: 1 } } })
  assert.deepEqual(page.data.listUnits.map(unit => unit.subtitleLanguage), ['en', 'zh'])
  page.toggleSubtitleLanguage({ currentTarget: { dataset: { unitIndex: 1 } } })
  assert.deepEqual(page.data.listUnits.map(unit => unit.subtitleLanguage), ['en', 'en'])
})

test('list mode injects a review level after every three real levels', () => {
  const { page } = loadHomePage()
  page.resetVisibleUnits(Array.from({ length: 4 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 12,
    completed: index < 3
  })))

  assert.equal(page.data.units.length, 4)
  assert.deepEqual(page.data.listUnits.map(unit => unit.isReview), [
    false, false, false, true, false
  ])
  // Map mode (units / mapTrail) stays free of review nodes
  assert.ok(page.data.units.every(unit => !unit.isReview))
})

test('tapping a review task opens practice in review mode for the covered levels', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.resetVisibleUnits(Array.from({ length: 3 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 12,
    completed: true
  })))

  const reviewIndex = page.data.listUnits.findIndex(unit => unit.isReview)
  page.handleListTaskTap({
    currentTarget: { dataset: { taskType: 'word', unitIndex: reviewIndex } }
  })

  assert.equal(calls.showToast.length, 0)
  assert.equal(calls.navigateTo.length, 1)
  const url = calls.navigateTo[0].url
  assert.match(url, /\/practice\/practice\?/)
  assert.match(url, /taskType=word/)
  assert.match(url, /review=1/)
  assert.match(url, /unitId=unit-1/)
  assert.match(url, /reviewUnitIds=unit-1%2Cunit-2%2Cunit-3/)
})

test('tapping a review listening task opens the listen quiz in review mode', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.resetVisibleUnits(Array.from({ length: 3 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 12,
    completed: true
  })))

  const reviewIndex = page.data.listUnits.findIndex(unit => unit.isReview)
  page.handleListTaskTap({
    currentTarget: { dataset: { taskType: 'listening', unitIndex: reviewIndex } }
  })

  assert.equal(calls.navigateTo.length, 1)
  const url = calls.navigateTo[0].url
  assert.match(url, /\/listen\/listen\?/)
  assert.match(url, /mode=quiz/)
  assert.match(url, /review=1/)
})

test('a locked review level prompts the learner to finish earlier levels first', () => {
  const { page, calls } = loadHomePage()
  page.resetVisibleUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 12, completed: true },
    { unitId: 'unit-2', sort: 2, wordTotal: 12, completed: false },
    { unitId: 'unit-3', sort: 3, wordTotal: 12, completed: false }
  ])

  const reviewIndex = page.data.listUnits.findIndex(unit => unit.isReview)
  assert.equal(page.data.listUnits[reviewIndex].locked, true)
  page.handleListTaskTap({
    currentTarget: { dataset: { taskType: 'word', unitIndex: reviewIndex } }
  })

  assert.equal(calls.navigateTo.length, 0)
  assert.equal(calls.showToast[0].title, '完成前面的关卡后解锁复习')
})

test('locked recitation shows an unlock toast instead of navigating', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book' }
  page.data.units = [{ unitId: 'unit-1', locked: true }]

  page.handleTaskTap({
    currentTarget: {
      dataset: {
        taskType: 'recitation',
        unitIndex: 0
      }
    }
  })

  assert.equal(calls.navigateTo.length, 0)
  assert.equal(calls.showToast[0].title, '开通会员后解锁')
})

test('unlocked recitation navigates with the selected unit id', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.units = [{ unitId: 'unit-7', locked: false }]

  page.handleTaskTap({
    currentTarget: {
      dataset: {
        taskType: 'recitation',
        unitIndex: 0
      }
    }
  })

  assert.equal(calls.showToast.length, 0)
  assert.match(calls.navigateTo[0].url, /resBookId=book-1/)
  assert.match(calls.navigateTo[0].url, /unitId=unit-7/)
})

test('map level taps reveal details and start the selected unit', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.units = [{
    unitId: 'unit-7',
    locked: false,
    sort: 7,
    levelWords: 20,
    subtitleEnglish: 'Practice makes progress.',
    subtitleChinese: '熟能生巧。',
    subtitleLanguage: 'en'
  }]

  page.handleMapLevelTap({
    currentTarget: {
      dataset: {
        unitIndex: 0
      }
    }
  })

  assert.equal(page.data.selectedMapUnitIndex, 0)

  page.handleMapStartTap({
    currentTarget: {
      dataset: {
        unitIndex: 0
      }
    }
  })

  assert.equal(calls.showToast.length, 0)
  assert.match(calls.navigateTo[0].url, /resBookId=book-1/)
  assert.match(calls.navigateTo[0].url, /unitId=unit-7/)
})

test('locked map levels show an unlock toast instead of navigating', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.units = [{ unitId: 'unit-locked', locked: true }]

  page.handleMapStartTap({
    currentTarget: {
      dataset: {
        unitIndex: 0
      }
    }
  })

  assert.equal(calls.navigateTo.length, 0)
  assert.equal(calls.showToast[0].title, '开通会员后解锁')
})

test('word tasks navigate to the word new detail mode', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.units = [{ unitId: 'unit-word', locked: false }]

  page.handleTaskTap({
    currentTarget: {
      dataset: {
        taskType: 'word',
        unitIndex: 0
      }
    }
  })

  assert.equal(calls.showToast.length, 0)
  assert.match(calls.navigateTo[0].url, /resBookId=book-1/)
  assert.match(calls.navigateTo[0].url, /unitId=unit-word/)
  assert.match(calls.navigateTo[0].url, /taskType=word/)
})

test('book picker shows unlock status and a buy action for locked books', () => {
  assert.match(homeTemplate, /book-picker-status/)
  assert.match(homeTemplate, /{{item\.locked \? '未解锁' : '已解锁'}}/)
  assert.match(homeTemplate, /class="book-picker-buy">购买/)
  assert.match(homeScript, /isBookLocked/)
  assert.match(homeScript, /enrichPickerBooks/)
})

test('selectBook on a locked book opens the purchase page', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.allBooks = [{
    resBookId: 'book-2',
    name: 'Locked Book',
    wordCount: 1000,
    locked: true
  }]
  page.data.bookPickerVisible = true

  page.selectBook({
    currentTarget: {
      dataset: {
        resBookId: 'book-2'
      }
    }
  })

  assert.equal(page.data.bookPickerVisible, false)
  assert.match(calls.navigateTo[0].url, /advertisement\/advertisement/)
  assert.match(calls.navigateTo[0].url, /resBookId=book-2/)
})
