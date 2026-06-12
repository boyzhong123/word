const test = require('node:test')
const assert = require('node:assert/strict')

const {
  UNLOCK_ALL_TASKS_FOR_DEV,
  DISPLAY_BATCH_SIZE,
  REVIEW_INTERVAL,
  buildDisplayUnits,
  buildListUnits,
  markTodayTasks,
  groupListUnits,
  buildMapSections,
  getNextVisibleCount
} = require('../pages/home/home-units')

test('buildDisplayUnits maps every API unit and sorts by sort ascending', () => {
  const units = buildDisplayUnits([
    { unitId: 'unit-3', sort: 3, wordTotal: 9 },
    { unitId: 'unit-1', sort: 1, wordTotal: 12 },
    { unitId: 'unit-2', sort: 2, wordTotal: 15 }
  ])

  assert.equal(units.length, 3)
  assert.deepEqual(units.map(unit => unit.unitId), ['unit-1', 'unit-2', 'unit-3'])
  assert.deepEqual(units.map(unit => unit.title), [
    '关卡 1 · 12词',
    '关卡 2 · 15词',
    '关卡 3 · 9词'
  ])
})

test('different levels rotate through at least 200 bilingual learning sayings', () => {
  const units = buildDisplayUnits(Array.from({ length: 205 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 12
  })))

  assert.ok(new Set(units.map(unit => unit.subtitleEnglish)).size >= 200)
  assert.ok(units.every(unit => unit.subtitle === unit.subtitleEnglish))
  assert.ok(units.every(unit => unit.subtitleLanguage === 'en'))
  assert.ok(units.every(unit => /^[\x20-\x7e]+$/.test(unit.subtitleEnglish)))
  assert.ok(units.every(unit => /[\u4e00-\u9fff]/.test(unit.subtitleChinese)))
})

test('category cards use the same jelly monster with state-specific frames', (t) => {
  if (UNLOCK_ALL_TASKS_FOR_DEV) {
    t.skip('sequential unlock is disabled in dev mode')
  }
  const units = buildDisplayUnits(Array.from({ length: 6 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 12,
    completed: index === 0,
    needVip: index === 2
  })))

  assert.deepEqual(units.map(unit => unit.cardMonsterName), [
    'jelly',
    'jelly',
    'jelly',
    'jelly',
    'jelly',
    'jelly'
  ])
  assert.deepEqual(units.map(unit => unit.cardMonsterState), [
    'defeated',
    'fighting',
    'locked',
    'locked',
    'locked',
    'locked'
  ])
  assert.deepEqual(units.map(unit => unit.cardMonsterSprite), [
    '/images/home/map/monsters/jelly-defeated.png',
    '/images/home/map/monsters/jelly-fighting.png',
    '/images/home/map/monsters/jelly-locked.png',
    '/images/home/map/monsters/jelly-locked.png',
    '/images/home/map/monsters/jelly-locked.png',
    '/images/home/map/monsters/jelly-locked.png'
  ])
  assert.equal(units[0].cardMonsterFrameCount, 1)
  assert.equal(units[1].cardMonsterFrameCount, 6)
  assert.equal(units[2].cardMonsterFrameCount, 1)
  assert.equal(units[0].cardMonsterFrameSize, 166)
})

test('completed units show full progress for all three tasks', () => {
  const [unit] = buildDisplayUnits([
    { unitId: 'complete', sort: 1, wordTotal: 12, completed: true }
  ])

  assert.equal(unit.locked, false)
  assert.equal(unit.doneStages, 3)
  assert.equal(unit.stageColor, '#111318')
  assert.equal(unit.mascot, '../../images/home/mascot-progress.png')
  assert.equal(unit.mascotSprite, '../../images/home/mascot-progress-sprite.png')
  assert.equal(unit.mascotDuration, 2.4)
  assert.deepEqual(unit.stageStars, [true, true, true])
  assert.deepEqual(unit.tasks.map(task => [task.current, task.total, task.percent]), [
    [12, 12, 100],
    [12, 12, 100],
    [12, 12, 100]
  ])
})

test('unfinished units show zero progress', () => {
  const [unit] = buildDisplayUnits([
    { unitId: 'unfinished', sort: 2, wordTotal: 12, completed: false }
  ])

  assert.equal(unit.locked, false)
  assert.equal(unit.doneStages, 0)
  assert.equal(unit.stageColor, '#111318')
  assert.equal(unit.mascot, '../../images/home/mascot-alert.png')
  assert.equal(unit.mascotSprite, '../../images/home/mascot-alert-sprite.png')
  assert.equal(unit.mascotDuration, 2.4)
  assert.deepEqual(unit.stageStars, [false, false, false])
  assert.deepEqual(unit.tasks.map(task => [task.current, task.total, task.percent]), [
    [0, 12, 0],
    [0, 12, 0],
    [0, 12, 0]
  ])
})

test('needVip locks a unit and overrides completed progress', () => {
  const [unit] = buildDisplayUnits([
    { unitId: 'locked', sort: 1, wordTotal: 12, completed: 1, needVip: '1' }
  ])

  assert.equal(unit.locked, true)
  assert.equal(unit.doneStages, 0)
  assert.equal(unit.stageColor, '#5c636a')
  assert.equal(unit.mascot, '../../images/home/mascot-sleep.png')
  assert.equal(unit.mascotSprite, '../../images/home/mascot-sleep-sprite.png')
  assert.equal(unit.mascotDuration, 3.2)
  assert.deepEqual(unit.stageStars, [false, false, false])
  assert.deepEqual(unit.tasks.map(task => [task.current, task.total, task.percent]), [
    [0, 12, 0],
    [0, 12, 0],
    [0, 12, 0]
  ])
})

test('empty API data returns a cloned fallback list', () => {
  const fallback = [{
    unitId: 'fallback',
    sort: 2,
    levelWords: 36,
    doneStages: 2,
    tasks: [{ type: 'word', current: 1 }]
  }]

  const units = buildDisplayUnits([], fallback)
  units[0].tasks[0].current = 99

  assert.notEqual(units, fallback)
  assert.equal(units[0].sort, 2)
  assert.equal(units[0].title, '关卡 2 · 36词')
  assert.deepEqual(units[0].stageStars, [true, true, false])
  assert.equal(fallback[0].tasks[0].current, 1)
})

test('getNextVisibleCount adds one batch without exceeding total', () => {
  assert.equal(DISPLAY_BATCH_SIZE, 20)
  assert.equal(getNextVisibleCount(55, 0), 20)
  assert.equal(getNextVisibleCount(55, 20), 40)
  assert.equal(getNextVisibleCount(55, 40), 55)
  assert.equal(getNextVisibleCount(55, 55), 55)
})

test('demo treats the first level as fully completed with a defeated monster', () => {
  const [unit] = buildDisplayUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 12, completed: false }
  ])

  assert.equal(unit.mapState, 'completed')
  assert.equal(unit.doneStages, 3)
  assert.deepEqual(unit.stageStars, [true, true, true])
  assert.equal(unit.cardMonsterState, 'defeated')
  assert.equal(unit.cardMonsterSprite, '/images/home/map/monsters/jelly-defeated.png')
  assert.deepEqual(unit.tasks.map(task => task.percent), [100, 100, 100])
})

test('map progress exposes completed, active, upcoming, and locked task states', (t) => {
  if (UNLOCK_ALL_TASKS_FOR_DEV) {
    t.skip('sequential unlock is disabled in dev mode')
  }
  const units = buildDisplayUnits([
    { unitId: 'complete', sort: 1, wordTotal: 12, completed: true },
    { unitId: 'current', sort: 2, wordTotal: 12 },
    { unitId: 'future', sort: 3, wordTotal: 12 },
    { unitId: 'locked', sort: 4, wordTotal: 12, needVip: true }
  ])

  assert.equal(units[0].mapState, 'completed')
  assert.deepEqual(units[0].tasks.map(task => task.mapState), [
    'completed',
    'completed',
    'completed'
  ])
  assert.equal(units[1].mapState, 'active')
  assert.deepEqual(units[1].tasks.map(task => task.mapState), [
    'active',
    'upcoming',
    'upcoming'
  ])
  assert.equal(units[2].mapState, 'upcoming')
  assert.equal(units[3].mapState, 'locked')
  assert.deepEqual(units[3].tasks.map(task => task.mapState), [
    'locked',
    'locked',
    'locked'
  ])
  assert.deepEqual(units[1].tasks.map(task => task.mapPosition), [
    'left',
    'right',
    'center'
  ])
})

test('map progress builds a continuous level route with image nodes and animated monsters', (t) => {
  if (UNLOCK_ALL_TASKS_FOR_DEV) {
    t.skip('sequential unlock is disabled in dev mode')
  }
  const units = buildDisplayUnits([
    { unitId: 'complete', sort: 1, wordTotal: 12, completed: true },
    { unitId: 'current', sort: 2, wordTotal: 18 },
    { unitId: 'future-1', sort: 3, wordTotal: 21 },
    { unitId: 'future-2', sort: 4, wordTotal: 24 },
    { unitId: 'locked', sort: 5, wordTotal: 30, needVip: true },
    { unitId: 'future-3', sort: 6, wordTotal: 33 }
  ])

  assert.deepEqual(units.slice(0, 4).map(unit => unit.mapLane), [
    'center',
    'left',
    'right',
    'left'
  ])
  assert.deepEqual(units.slice(0, 3).map(unit => unit.connectorClass), [
    'center-left',
    'left-right',
    'right-left'
  ])
  assert.ok(units[0].hasConnector)
  assert.equal(units[0].mapButton, '../../images/home/map/level-node-completed.png')
  assert.equal(units[1].mapButton, '../../images/home/map/level-node-current.png')
  assert.equal(units[2].mapButton, '../../images/home/map/level-node-upcoming.png')
  assert.equal(units[4].mapButton, '../../images/home/map/level-node-locked.png')

  assert.equal(units[1].hasMonster, true)
  assert.equal(units[1].monsterName, 'jelly')
  assert.equal(units[1].monsterState, 'fighting')
  assert.equal(units[1].monsterSprite, '/images/home/map/monsters/jelly-fighting.png')
  assert.equal(units[1].monsterFrameCount, 6)
  assert.equal(units[1].monsterFrameSize, 166)

  assert.equal(units[5].hasMonster, true)
  assert.equal(units[5].monsterName, 'jelly')
  assert.equal(units[5].monsterState, 'locked')
  assert.equal(units[5].monsterSprite, '/images/home/map/monsters/jelly-locked.png')
})

test('buildListUnits inserts a review level after every three real levels', () => {
  const units = buildDisplayUnits(Array.from({ length: 7 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 10,
    completed: index < 3
  })))

  const listUnits = buildListUnits(units)

  assert.equal(REVIEW_INTERVAL, 3)
  // 7 real levels => reviews after #3 and #6 only (the trailing #7 has no group)
  assert.deepEqual(listUnits.map(unit => unit.isReview), [
    false, false, false, true,
    false, false, false, true,
    false
  ])
})

test('a 5-card daily goal boxes up exactly 5 cards, review included as a slot', () => {
  const units = buildDisplayUnits(Array.from({ length: 6 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 10
  })))

  const goal = 5
  const groups = groupListUnits(markTodayTasks(buildListUnits(units), goal))

  // Exactly one today box, holding the next five cards along the sequence with
  // the review counted as the 3rd slot (unit-1 is demo-completed). The second
  // review is out of reach and belongs to the next batch.
  const todayGroups = groups.filter(group => group.today)
  assert.equal(todayGroups.length, 1)
  assert.deepEqual(
    todayGroups[0].units.map(unit => unit.isReview ? 'review' : unit.unitId),
    ['unit-2', 'unit-3', 'review', 'unit-4', 'unit-5']
  )
})

test('buildListUnits review card mirrors the regular layout with wrong-word content', () => {
  const units = buildDisplayUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 10, completed: true },
    { unitId: 'unit-2', sort: 2, wordTotal: 12, completed: true },
    { unitId: 'unit-3', sort: 3, wordTotal: 8, completed: true }
  ])

  const review = buildListUnits(units).find(unit => unit.isReview)

  assert.ok(review)
  assert.equal(review.key, 'review-1')
  assert.equal(review.reviewWords, 30)
  assert.equal(review.title, '复习 · 错词巩固 · 30词')
  assert.equal(review.locked, false)
  // Same three-task layout as a regular card, retargeted at review content
  assert.deepEqual(review.tasks.map(task => task.type), ['word', 'recitation', 'listening'])
  assert.deepEqual(review.tasks.map(task => task.label), ['错词重学', '错词跟读', '错词听力'])
  assert.deepEqual(review.tasks.map(task => [task.current, task.total, task.percent]), [
    [0, 30, 0],
    [0, 30, 0],
    [0, 30, 0]
  ])
  assert.equal(review.cardMonsterFrameCount, 6)
  assert.ok(review.cardMonsterSprite.startsWith('/images/home/map/monsters/'))
})

test('buildListUnits prefers explicit wrong-word counts and locks until the group is cleared', () => {
  const units = buildDisplayUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 10, wrongWords: 3, completed: true },
    { unitId: 'unit-2', sort: 2, wordTotal: 12, wrongWords: 5, completed: false },
    { unitId: 'unit-3', sort: 3, wordTotal: 8, wrongWords: 2 }
  ])

  const review = buildListUnits(units).find(unit => unit.isReview)

  assert.equal(review.reviewWords, 10)
  assert.equal(review.locked, true)
})

test('markTodayTasks flags the next N cards, counting reviews and skipping done/VIP', () => {
  const units = buildDisplayUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 10, completed: true },
    { unitId: 'unit-2', sort: 2, wordTotal: 12 },
    { unitId: 'unit-3', sort: 3, wordTotal: 8 },
    { unitId: 'unit-4', sort: 4, wordTotal: 9 },
    { unitId: 'unit-5', sort: 5, wordTotal: 11, needVip: true }
  ])

  // Sequence: u1✓, u2, u3, [review], u4, u5(VIP). Goal 4 => skip done u1, take
  // u2, u3, the review, then u4 (the pending review still counts as a step).
  const marked = markTodayTasks(buildListUnits(units), 4)
  const todayCards = marked
    .filter(unit => unit.isTodayTask)
    .map(unit => unit.isReview ? 'review' : unit.unitId)

  assert.deepEqual(todayCards, ['unit-2', 'unit-3', 'review', 'unit-4'])
  // Completed and VIP-locked levels never count.
  assert.equal(marked.find(unit => unit.unitId === 'unit-1').isTodayTask, false)
  assert.equal(marked.find(unit => unit.unitId === 'unit-5').isTodayTask, false)
})

test('markTodayTasks excludes a review that covers VIP levels', () => {
  const units = buildDisplayUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 10 },
    { unitId: 'unit-2', sort: 2, wordTotal: 12 },
    { unitId: 'unit-3', sort: 3, wordTotal: 8, needVip: true }
  ])

  // The review covers a VIP level, so it is not part of the free daily plan.
  const marked = markTodayTasks(buildListUnits(units), 5)
  const review = marked.find(unit => unit.isReview)
  assert.equal(review.lockedByVip, true)
  assert.equal(review.isTodayTask, false)
})

test('groupListUnits bundles consecutive today levels into one group, others alone', () => {
  const units = buildDisplayUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 10, completed: true },
    { unitId: 'unit-2', sort: 2, wordTotal: 12 },
    { unitId: 'unit-3', sort: 3, wordTotal: 8 }
  ])

  const groups = groupListUnits(markTodayTasks(buildListUnits(units), 2))

  // Exactly one today box, holding exactly the two consecutive today levels —
  // the goal doesn't reach the review, so it stays outside (next batch).
  const todayGroups = groups.filter(group => group.today)
  assert.equal(todayGroups.length, 1)
  assert.deepEqual(
    todayGroups[0].units.map(unit => unit.isReview ? 'review' : unit.unitId),
    ['unit-2', 'unit-3']
  )
  // Each entry keeps its original listUnits index for tap/toggle handlers
  assert.deepEqual(
    todayGroups[0].units.map(unit => unit.listIndex),
    [1, 2]
  )
  // unit-1 (done) renders on its own card, outside the box
  const firstSingle = groups.find(group => !group.today)
  assert.equal(firstSingle.unit.unitId, 'unit-1')
  assert.equal(firstSingle.unit.listIndex, 0)
})

test('groupListUnits keeps every level on its own card when nothing is for today', () => {
  const units = buildDisplayUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 10 },
    { unitId: 'unit-2', sort: 2, wordTotal: 12 }
  ])

  const groups = groupListUnits(markTodayTasks(buildListUnits(units), 0))
  assert.equal(groups.every(group => group.today === false), true)
  assert.equal(groups.length, 2)
})

test('markTodayTasks marks nothing when the daily goal is zero', () => {
  const units = buildDisplayUnits([
    { unitId: 'unit-1', sort: 1, wordTotal: 10 },
    { unitId: 'unit-2', sort: 2, wordTotal: 12 }
  ])

  const marked = markTodayTasks(buildListUnits(units), 0)
  assert.equal(marked.some(unit => unit.isTodayTask), false)
})

test('buildMapSections groups levels into themed road-map chapters', () => {
  const units = buildDisplayUnits(Array.from({ length: 8 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 12 + index,
    completed: index < 2
  })))

  const sections = buildMapSections(units)

  assert.equal(sections.length, 2)
  assert.equal(sections[0].stageNumber, 1)
  assert.equal(sections[0].title, '描述饮料')
  assert.equal(sections[0].subtitle, '第 1-6 关')
  assert.equal(sections[0].completedCount, 2)
  assert.equal(sections[0].background, '../../images/home/map/road-section.png')
  assert.deepEqual(sections[0].units.map(unit => unit.sectionSlot), [0, 1, 2, 3, 4, 5])
  assert.deepEqual(sections[0].units.map(unit => unit.mapGlobalIndex), [0, 1, 2, 3, 4, 5])

  assert.equal(sections[1].stageNumber, 2)
  assert.equal(sections[1].title, '认识动物')
  assert.equal(sections[1].subtitle, '第 7-8 关')
  assert.deepEqual(sections[1].units.map(unit => unit.sectionSlot), [0, 1])
  assert.deepEqual(sections[1].units.map(unit => unit.mapGlobalIndex), [6, 7])
})
