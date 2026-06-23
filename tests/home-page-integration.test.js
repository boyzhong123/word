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
    switchTab: [],
    showToast: []
  }
  const globalData = {
    BASE_URL: 'https://example.test',
    token: '',
    openBookPicker: false,
    pendingBookId: ''
  }

  global.getApp = () => ({
    globalData
  })
  const storage = {}
  global.wx = {
    getSystemInfoSync: () => ({
      windowHeight: 800,
      safeArea: { bottom: 780 }
    }),
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = value },
    navigateTo: options => {
      calls.navigateTo.push(options)
      if (options && typeof options.success === 'function') {
        options.success()
      }
    },
    switchTab: options => calls.switchTab.push(options),
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
  const heroPath = path.join(projectRoot, 'images/home/hero-campus-jelly-v5-trio.png')
  assert.ok(fs.existsSync(heroPath))
  assert.match(homeTemplate, /heroImageUrl/)
  assert.match(homeScript, /buildCharacterImageUrls/)
  assert.match(homeTemplate, /class="hero-image"[^>]*mode="widthFix"/)
  assert.match(homeTemplate, /hero-image-clip/)
  assert.match(homeTemplate, /hero-slogan-line/)
  assert.match(homeTemplate, /style="{{heroClipStyle}}"/)
  assert.match(homeScript, /HERO_IMAGE_HEIGHT_RPX/)
  assert.match(homeScript, /heroClipStyle:/)
  assert.match(homeStyle, /\.hero-image\s*{[^}]*width:\s*100%/s)
  assert.match(homeStyle, /\.hero-image\s*{[^}]*max-width:\s*100%/s)
  assert.match(homeStyle, /\.hero-image-clip\s*{[^}]*overflow:\s*hidden/s)
})

test('home monster hint toast uses the jelly icon plus text layout', () => {
  assert.match(homeTemplate, /class="home-monster-hint"/)
  assert.match(homeTemplate, /home-monster-hint-icon/)
  assert.match(homeTemplate, /\/images\/home\/toast-hint\.png/)
  assert.match(homeScript, /showMonsterHint\(/)
  assert.match(homeStyle, /\.home-monster-hint-icon\s*{[^}]*width:\s*64rpx/s)
  assert.match(homeStyle, /\.home-monster-hint-box\s*{[^}]*flex-direction:\s*row/s)
  assert.match(homeStyle, /@keyframes home-monster-hint-life/)
  const hintIconPath = path.join(projectRoot, 'images/home/toast-hint.png')
  assert.ok(fs.existsSync(hintIconPath))
})

test('home scroll view fills the full screen height with a tab-bar spacer', () => {
  assert.match(homeTemplate, /style="{{scrollViewStyle}}"/)
  assert.match(homeTemplate, /style="{{scrollSpacerStyle}}"/)
  // 必须用 screenHeight（满屏），不能用 windowHeight：真机自定义 tabBar 下
  // windowHeight 扣了底栏，写死它会在底栏上方留出空带遮挡内容。
  assert.match(homeScript, /scrollViewStyle:\s*'height: '\s*\+\s*screenHeight\s*\+\s*'px;'/)
  assert.doesNotMatch(homeScript, /scrollViewStyle:\s*'height: '\s*\+\s*windowHeight\s*\+\s*'px;'/)
  assert.match(homeScript, /scrollSpacerStyle:\s*'height: '\s*\+\s*scrollSpacerRpx\s*\+\s*'rpx;'/)
  assert.match(homeScript, /scrollViewHeight:\s*screenHeight/)
  assert.match(homeScript, /\bscrollSpacerRpx\b/)
  assert.doesNotMatch(homeStyle, /\.scroll-spacer\s*{[^}]*height:\s*112rpx/s)
})

test('home template binds dynamic styles as complete style strings', () => {
  const dynamicStyles = [...homeTemplate.matchAll(/style="([^"]*\{\{[^"]*)"/g)].map(match => match[1])
  assert.ok(dynamicStyles.length > 0)
  dynamicStyles.forEach(styleValue => {
    assert.match(styleValue, /^\{\{[a-zA-Z0-9_.]+\}\}$/)
  })
  assert.doesNotMatch(homeTemplate, /style="[^"]*:\s*\{\{/)
  assert.doesNotMatch(homeTemplate, /style="[^"]*\{\{[^"]*;\s*[a-z-]+:/)
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

test('unit cards keep their height but balance the inner whitespace', () => {
  assert.match(homeStyle, /\.unit-card\s*{[^}]*height:\s*244rpx/s)
  assert.match(homeStyle, /\.unit-card\s*{[^}]*padding:\s*20rpx 19rpx;/s)
  assert.match(homeStyle, /\.unit-top\s*{[^}]*height:\s*104rpx/s)
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
  assert.match(homeTemplate, /cardMonsterState === 'fighting'[\s\S]*pkSpriteUrl/)
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
  assert.match(homeStyle, /\.unit-card-monster-defeated\s*{[^}]*top:\s*-27rpx/s)
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
  assert.match(homeScript, /showMonsterHint\('开通会员后解锁'\)/)
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
  assert.equal(page.data.monsterHint.visible, true)
  assert.equal(page.data.monsterHint.text, '完成前面的关卡后解锁复习')
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
  assert.equal(page.data.monsterHint.visible, true)
  assert.equal(page.data.monsterHint.text, '开通会员后解锁')
})

test('purchased demo books unlock vip-gated units on the home page', () => {
  const { page, calls } = loadHomePage()
  wx.setStorageSync('devPurchasedBooks', ['demo-rj-7a'])
  page.data.book = {
    resBookId: 'demo-rj-7a',
    name: '(新)七年级上册',
    unlocked: 1,
    needVip: 0
  }
  page.resetVisibleUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 12, needVip: 1 }
  ])

  assert.equal(page.data.units[0].locked, false)
  page.handleListTaskTap({
    currentTarget: {
      dataset: {
        taskType: 'word',
        unitIndex: 0
      }
    }
  })

  assert.equal(calls.showToast.length, 0)
  assert.equal(page.data.monsterHint.visible, false)
  assert.equal(calls.navigateTo.length, 1)
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
  // 第 1 关之外的关卡需会员，模拟已开通会员后可直接开始
  wx.setStorageSync('membership', { tierId: 'y1', expireAt: Date.now() + 86400000 })
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
  assert.equal(page.data.monsterHint.visible, true)
  assert.equal(page.data.monsterHint.text, '开通会员后解锁')
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

test('book picker uses lock overlay for unpurchased books without extra badges', () => {
  assert.match(homeTemplate, /点击教材查看详情/)
  assert.doesNotMatch(homeTemplate, /切换后立即生效/)
  assert.match(homeTemplate, /icon-picker-lock\.svg/)
  assert.doesNotMatch(homeTemplate, /icon-picker-owned\.svg/)
  assert.doesNotMatch(homeTemplate, /icon-picker-buy\.svg/)
  assert.doesNotMatch(homeTemplate, /已购买/)
  assert.match(homeTemplate, /book-picker-switch-buy/)
  assert.match(homeScript, /isBookLocked/)
  assert.match(homeScript, /enrichPickerBooks/)
})

test('book picker cell uses both cover and switch bar to change books', () => {
  assert.match(homeTemplate, /class="book-picker-cover-wrap"[^>]*catchtap="goBookDetail"/)
  assert.match(homeTemplate, /class="book-picker-switch \{\{item\.locked \? 'book-picker-switch-buy' : ''\}\}"[^>]*catchtap="switchBookUse"/)
  assert.match(homeTemplate, /book-picker-switch-current/)
  assert.doesNotMatch(homeTemplate, /bindtap="selectBook"/)
  assert.match(homeStyle, /\.book-picker-switch\s*{/)
})

test('book picker buy button now switches books instead of opening detail', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.allBooks = [{
    resBookId: 'book-2',
    name: 'Owned Book',
    wordCount: 1200,
    locked: false,
    demo: true
  }]
  page.data.bookPickerVisible = true
  let switched = null
  page.updateBook = selected => { switched = selected }
  page.resetVisibleUnits = () => {}
  page.loadUnits = () => {}

  page.goBuyFromPicker({
    currentTarget: { dataset: { resBookId: 'book-2' } }
  })

  assert.equal(page.data.bookPickerVisible, false)
  assert.equal(calls.navigateTo.length, 0)
  assert.ok(switched && switched.resBookId === 'book-2')
})

test('book picker cover tap switches to a locked book without opening detail', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.allBooks = [{
    resBookId: 'book-2',
    name: 'Locked Book',
    wordCount: 1000,
    locked: true,
    demo: true
  }]
  page.data.bookPickerVisible = true
  let switched = null
  page.updateBook = selected => { switched = selected }
  page.resetVisibleUnits = () => {}
  page.loadUnits = () => {}

  page.goBookDetail({
    currentTarget: { dataset: { resBookId: 'book-2' } }
  })

  assert.equal(page.data.bookPickerVisible, false)
  assert.equal(calls.navigateTo.length, 0)
  assert.ok(switched && switched.resBookId === 'book-2')
})

test('book picker cover tap switches to an owned book without opening detail', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.allBooks = [{
    resBookId: 'book-2',
    name: 'Owned Book',
    bookCover: '/cover.png',
    wordCount: 1200,
    proverbCount: 300,
    press: '人教版',
    locked: false,
    demo: true
  }]
  page.data.bookPickerVisible = true
  let switched = null
  page.updateBook = selected => { switched = selected }
  page.resetVisibleUnits = () => {}
  page.loadUnits = () => {}

  page.goBookDetail({
    currentTarget: { dataset: { resBookId: 'book-2' } }
  })

  assert.equal(page.data.bookPickerVisible, false)
  assert.equal(calls.showToast.length, 0)
  assert.equal(calls.navigateTo.length, 0)
  assert.ok(switched && switched.resBookId === 'book-2')
})

test('book picker cover tap switches to a demo book without opening detail', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.allBooks = [{
    resBookId: 'demo-rj-7a',
    name: '(新)七年级上册',
    bookCover: '/mock.png',
    wordCount: 486,
    press: '人教版',
    demo: true,
    locked: true
  }]
  page.data.bookPickerVisible = true
  let switched = null
  page.updateBook = selected => { switched = selected }
  page.resetVisibleUnits = () => {}
  page.loadUnits = () => {}

  page.goBookDetail({
    currentTarget: { dataset: { resBookId: 'demo-rj-7a' } }
  })

  assert.equal(page.data.bookPickerVisible, false)
  assert.equal(calls.showToast.length, 0)
  assert.equal(calls.navigateTo.length, 0)
  assert.ok(switched && switched.resBookId === 'demo-rj-7a')
})

test('book picker switch bar switches the active book without opening detail', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.allBooks = [{
    resBookId: 'demo-rj-7a',
    name: '(新)七年级上册',
    bookCover: '/mock.png',
    wordCount: 486,
    demo: true
  }]
  page.data.bookPickerVisible = true

  // 隔离切换后的网络/渲染副作用，只验证走了切换分支、且没有跳详情页
  let switched = null
  page.updateBook = (selected) => { switched = selected }
  page.resetVisibleUnits = () => {}
  page.loadUnits = () => {}

  page.switchBookUse({
    currentTarget: { dataset: { resBookId: 'demo-rj-7a' } }
  })

  assert.equal(page.data.bookPickerVisible, false)
  assert.equal(calls.navigateTo.length, 0)
  assert.ok(switched && switched.resBookId === 'demo-rj-7a')
})

test('book picker opened from today returns to today tab after switching book', () => {
  assert.match(homeScript, /openBookPicker[\s\S]*returnToTodayAfterBookSwitch = true/)
  assert.match(homeScript, /returnToTodayAfterBookSwitch[\s\S]*wx\.switchTab\(\{ url: '\/pages\/today\/today' \}\)/)
  assert.match(homeScript, /globalData\.pendingBookId = selectedBook\.resBookId/)

  const { page, calls } = loadHomePage()
  page.returnToTodayAfterBookSwitch = true
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.allBooks = [{
    resBookId: 'demo-rj-7a',
    name: '(新)七年级上册',
    bookCover: '/mock.png',
    wordCount: 486,
    demo: true
  }]
  page.data.bookPickerVisible = true

  let switched = null
  page.updateBook = (selected) => { switched = selected }
  page.resetVisibleUnits = () => {}
  page.loadUnits = () => {}

  page.switchBookUse({
    currentTarget: { dataset: { resBookId: 'demo-rj-7a' } }
  })

  assert.ok(switched && switched.resBookId === 'demo-rj-7a')
  assert.equal(getApp().globalData.pendingBookId, 'demo-rj-7a')
  assert.equal(calls.switchTab.length, 1)
  assert.equal(calls.switchTab[0].url, '/pages/today/today')
})

test('book picker opened from today returns to today tab when closed without switching', () => {
  const { page, calls } = loadHomePage()
  page.returnToTodayAfterBookSwitch = true

  page.closeBookPicker()

  assert.equal(calls.switchTab.length, 1)
  assert.equal(calls.switchTab[0].url, '/pages/today/today')
  assert.equal(page.returnToTodayAfterBookSwitch, false)
})

test('today locate fab scrolls the today group to the top of the list', () => {
  assert.match(homeScript, /computeScrollTopToAlignTarget/)
  assert.doesNotMatch(homeScript, /computeScrollTopToCenterTarget/)
  assert.match(homeScript, /scrollToTodayTasks\(\)[\s\S]*#today-group/)
  assert.doesNotMatch(homeScript, /#today-scroll-target/)
  assert.match(homeTemplate, /id="today-group"/)
  assert.match(homeTemplate, /bindtap="scrollToTodayTasks"/)
})
