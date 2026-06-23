const test = require('node:test')
const assert = require('node:assert/strict')

global.wx = {
  _storage: {},
  getStorageSync(key) {
    return this._storage[key]
  },
  setStorageSync(key, value) {
    this._storage[key] = value
  }
}

const {
  findCurrentRouteTask,
  getTodayDateKey,
  hasShownTodayRouteGuideForBook,
  markTodayRouteGuideShown,
  shouldOfferTodayRouteGuide,
  TODAY_ROUTE_GUIDE_LAST_SHOWN_KEY
} = require('../utils/today-route-guide')

const targetLevels = [
  {
    key: 'lv-2',
    locked: false,
    tasks: [{ type: 'word', isCurrent: true, stepState: 'active' }]
  }
]

test('findCurrentRouteTask returns the active step in the current level', () => {
  const levels = [
    {
      key: 'lv-1',
      locked: false,
      tasks: [{ type: 'word', isCurrent: false, stepState: 'completed' }]
    },
    {
      key: 'lv-2',
      locked: false,
      tasks: [
        { type: 'word', isCurrent: false, stepState: 'completed' },
        { type: 'recitation', isCurrent: true, stepState: 'active' }
      ]
    }
  ]
  const current = findCurrentRouteTask(levels)
  assert.equal(current.level.key, 'lv-2')
  assert.equal(current.task.type, 'recitation')
})

test('shouldOfferTodayRouteGuide shows once per day per book and resets on book change', () => {
  const today = new Date('2026-06-23T10:00:00')
  const base = {
    targetLevels,
    allDone: false,
    blocked: false,
    resBookId: 'book-a'
  }

  assert.equal(shouldOfferTodayRouteGuide(base), true)

  markTodayRouteGuideShown('book-a', today)
  assert.equal(hasShownTodayRouteGuideForBook('book-a', today), true)
  assert.equal(shouldOfferTodayRouteGuide(base), false)

  assert.equal(shouldOfferTodayRouteGuide({
    targetLevels,
    allDone: false,
    blocked: false,
    resBookId: 'book-b'
  }), true)

  global.wx._storage[TODAY_ROUTE_GUIDE_LAST_SHOWN_KEY] = {
    date: '2026-06-22',
    resBookId: 'book-a'
  }
  assert.equal(shouldOfferTodayRouteGuide({
    targetLevels,
    allDone: false,
    blocked: false,
    resBookId: 'book-a'
  }), true)
})

test('shouldOfferTodayRouteGuide is false when all tasks are done or guide is blocked', () => {
  assert.equal(shouldOfferTodayRouteGuide({
    targetLevels,
    allDone: true,
    blocked: false,
    resBookId: 'book-a'
  }), false)
  assert.equal(shouldOfferTodayRouteGuide({
    targetLevels,
    allDone: false,
    blocked: true,
    resBookId: 'book-a'
  }), false)
})

test('today route guide storage key is stable', () => {
  assert.equal(TODAY_ROUTE_GUIDE_LAST_SHOWN_KEY, 'today-route-guide-last-shown-v1')
  assert.equal(getTodayDateKey(new Date('2026-06-23T10:00:00')), '2026-06-23')
})
