const DISPLAY_BATCH_SIZE = 20
// 临时放开顺序解锁，方便联调跟读背诵 / 听力小测；测完改回 false。
const UNLOCK_ALL_TASKS_FOR_DEV = false
// 演示：第一关视为已通关（三星 + 报告 + 小怪兽 defeated）；上线前改回 false。
const DEMO_FIRST_UNIT_COMPLETED = true
const LEARNING_SAYINGS = require('./learning-sayings')
const MAP_POSITIONS = ['left', 'right', 'center']
const MAP_LANES = ['center', 'left', 'right', 'left', 'center', 'right', 'left', 'right']
const MAP_SECTION_SIZE = 6
const MAP_SECTION_BACKGROUND = '../../images/home/map/road-section.png'
const MAP_SECTION_THEMES = [
  '描述饮料',
  '认识动物',
  '校园生活',
  '家庭朋友',
  '食物味道',
  '颜色形状',
  '运动游戏',
  '日常出行'
]
const MAP_NODE_IMAGES = {
  completed: '../../images/home/map/level-node-completed.png',
  active: '../../images/home/map/level-node-current.png',
  upcoming: '../../images/home/map/level-node-upcoming.png',
  locked: '../../images/home/map/level-node-locked.png'
}
const MAP_MONSTER_NAMES = ['jelly']
const MAP_MONSTER_INTERVAL = 4
const MAP_MONSTER_FIRST_INDEX = 1
const MAP_MONSTER_FRAME_COUNTS = {
  fighting: 6,
  defeated: 1,
  locked: 1
}
const MAP_MONSTER_FRAME_SIZE = 166
const CARD_MONSTER_FRAME_SIZE = 166

// Vertical闯关 trail geometry (rpx). Each level流向 from top to bottom as:
// 路牌 → 单词新学 → 跟读背诵 → 听力小测 → 小怪兽 → 下一关路牌
const TRAIL_CENTER_X = 346
const TRAIL_ROW_HEIGHT = 200
const TRAIL_TASK_HALF = 75
const TRAIL_MONSTER_HALF = 83
const TRAIL_TASK_ORDER = ['word', 'recitation', 'listening']
const TRAIL_OFFSETS = {
  signpost: 0,
  word: -150,
  recitation: 150,
  listening: -150,
  monster: 0
}

const TASK_DEFINITIONS = [
  {
    type: 'word',
    label: '单词新学',
    color: '#111318',
    icon: '../../images/home/task-word.png'
  },
  {
    type: 'recitation',
    label: '跟读背诵',
    color: '#ff8200',
    icon: '../../images/home/task-recitation.png'
  },
  {
    type: 'listening',
    label: '关卡小测',
    color: '#111318',
    icon: '../../images/home/task-listening.png'
  }
]

const TASK_COLOR_PALETTE = {
  word: { vivid: '#16a34a', muted: '#d9dbe0', iconBg: '#dcfce7' },
  recitation: { vivid: '#f97316', muted: '#ffd4a8', iconBg: '#ffedd5' },
  listening: { vivid: '#111318', muted: '#d9dbe0', iconBg: '#ededf0' }
}

const TASK_ICON_ASSETS = {
  word: {
    active: '../../images/home/task-word-active.svg',
    muted: '../../images/home/task-word-muted.svg'
  },
  recitation: {
    active: '../../images/home/task-recitation-active.svg',
    muted: '../../images/home/task-recitation-muted.svg'
  },
  listening: {
    active: '../../images/home/task-listening-active.svg',
    muted: '../../images/home/task-listening-muted.svg'
  }
}

function decorateTaskVisual(task) {
  const palette = TASK_COLOR_PALETTE[task.type] || {
    vivid: task.color || '#111318',
    muted: '#d0d0d0',
    iconBg: '#eef2f7'
  }
  const icons = TASK_ICON_ASSETS[task.type]
  const mapState = task.mapState || 'upcoming'
  const isActive = mapState === 'active'

  return Object.assign({}, task, {
    icon: icons ? (isActive ? icons.active : icons.muted) : task.icon,
    displayColor: isActive
      ? palette.vivid
      : (mapState === 'locked' ? '#d5d5d5' : palette.muted),
    iconBg: isActive ? palette.iconBg : 'transparent',
    iconOpacity: isActive ? 1 : 0.72
  })
}

const UNIT_STATES = {
  completed: {
    subtitle: '千里之行，始于足下。',
    subtitleColor: '#111318',
    stageColor: '#111318',
    mascot: '../../images/home/mascot-progress.png',
    mascotSprite: '../../images/home/mascot-progress-sprite.png',
    mascotDuration: 2.4
  },
  unfinished: {
    subtitle: '实践出真知。',
    subtitleColor: '#111318',
    stageColor: '#111318',
    mascot: '../../images/home/mascot-alert.png',
    mascotSprite: '../../images/home/mascot-alert-sprite.png',
    mascotDuration: 2.4
  },
  locked: {
    subtitle: '积跬步，至千里。',
    subtitleColor: '#777777',
    stageColor: '#777777',
    mascot: '../../images/home/mascot-sleep.png',
    mascotSprite: '../../images/home/mascot-sleep-sprite.png',
    mascotDuration: 3.2
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function isEnabled(value) {
  return value === true || value === 1 || value === '1'
}

function toNonNegativeInteger(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0
}

function buildStageStars(doneStages) {
  const completedStages = Math.min(toNonNegativeInteger(doneStages), 3)
  return [1, 2, 3].map(stage => stage <= completedStages)
}

function getSort(unit, index) {
  const sort = Number(unit.sort)
  return Number.isFinite(sort) && sort > 0 ? sort : index + 1
}

function getLearningSaying(sort) {
  return LEARNING_SAYINGS[(sort - 1) % LEARNING_SAYINGS.length]
}

function buildTasks(wordTotal, completed) {
  return TASK_DEFINITIONS.map(definition => Object.assign({}, definition, {
    current: completed ? wordTotal : 0,
    total: wordTotal,
    percent: completed ? 100 : 0
  }))
}

function getMapLane(index) {
  return MAP_LANES[index % MAP_LANES.length]
}

function getMapButton(mapState) {
  return MAP_NODE_IMAGES[mapState] || MAP_NODE_IMAGES.upcoming
}

function hasMonsterAt(index) {
  return index >= MAP_MONSTER_FIRST_INDEX &&
    (index - MAP_MONSTER_FIRST_INDEX) % MAP_MONSTER_INTERVAL === 0
}

function getMonsterName(index) {
  const monsterIndex = Math.floor((index - MAP_MONSTER_FIRST_INDEX) / MAP_MONSTER_INTERVAL)
  return MAP_MONSTER_NAMES[monsterIndex % MAP_MONSTER_NAMES.length]
}

function getMonsterSide(mapLane, index) {
  if (mapLane === 'left') {
    return 'right'
  }
  if (mapLane === 'right') {
    return 'left'
  }
  return index % 2 ? 'left' : 'right'
}

function getMonsterState(mapState) {
  if (mapState === 'completed') {
    return 'defeated'
  }
  if (mapState === 'active') {
    return 'fighting'
  }
  return 'locked'
}

function getMonsterDuration(monsterState) {
  if (monsterState === 'fighting') {
    return 0.9
  }
  if (monsterState === 'defeated') {
    return 1.35
  }
  return 2.35
}

function getMonsterFrameCount(monsterState) {
  return MAP_MONSTER_FRAME_COUNTS[monsterState] || 1
}

function buildMonsterSprite(monsterName, monsterState) {
  return '/images/home/map/monsters/' + monsterName + '-' + monsterState + '.png'
}

function getMapSectionTheme(sectionIndex) {
  return MAP_SECTION_THEMES[sectionIndex % MAP_SECTION_THEMES.length]
}

function applyFirstUnitDemoCompletion(unit) {
  if (!DEMO_FIRST_UNIT_COMPLETED || !unit || unit.sort !== 1 || unit.locked || unit.isReview) {
    return unit
  }

  const wordTotal = toNonNegativeInteger(unit.levelWords || unit.wordTotal)
  const sourceTasks = Array.isArray(unit.tasks) ? unit.tasks : []
  const tasks = sourceTasks.length
    ? sourceTasks.map(task => {
      const total = toNonNegativeInteger(task.total || wordTotal)
      return Object.assign({}, task, {
        current: total,
        total,
        percent: 100
      })
    })
    : buildTasks(wordTotal, true)

  return Object.assign({}, unit, {
    locked: false,
    doneStages: 3,
    stageStars: buildStageStars(3),
    tasks
  })
}

function buildDisplayUnit(unit, index) {
  const locked = isEnabled(unit.needVip)
  const sort = getSort(unit, index)
  const completed = (DEMO_FIRST_UNIT_COMPLETED && sort === 1 && !locked) ||
    (isEnabled(unit.completed) && !locked)
  const state = UNIT_STATES[locked ? 'locked' : (completed ? 'completed' : 'unfinished')]
  const wordTotal = toNonNegativeInteger(unit.wordTotal)
  const doneStages = completed ? 3 : 0
  const saying = getLearningSaying(sort)

  return Object.assign({}, unit, state, {
    unitId: unit.unitId || unit.id || '',
    sort,
    levelWords: wordTotal,
    title: '关卡 ' + sort + ' · ' + wordTotal + '词',
    subtitle: saying.english,
    subtitleEnglish: saying.english,
    subtitleChinese: saying.chinese,
    subtitleLanguage: 'en',
    locked,
    doneStages,
    stageStars: buildStageStars(doneStages),
    tasks: buildTasks(wordTotal, completed)
  })
}

function buildFallbackDisplayUnit(unit, index) {
  const display = clone(unit || {})
  const sort = getSort(display, index)
  const levelWords = toNonNegativeInteger(display.levelWords || display.wordTotal)
  const doneStages = Math.min(toNonNegativeInteger(display.doneStages), 3)
  const saying = getLearningSaying(sort)

  return Object.assign(display, {
    unitId: display.unitId || '',
    sort,
    levelWords,
    title: display.title || '关卡 ' + sort + ' · ' + levelWords + '词',
    subtitle: saying.english,
    subtitleEnglish: saying.english,
    subtitleChinese: saying.chinese,
    subtitleLanguage: 'en',
    doneStages,
    stageStars: buildStageStars(doneStages)
  })
}

function decorateMapProgress(units) {
  let activeAssigned = false

  const mappedUnits = units.map(unit => {
    const sourceTasks = Array.isArray(unit.tasks) ? unit.tasks : []
    const tasks = sourceTasks.map((task, index) => {
      let mapState = 'upcoming'

      if (unit.locked) {
        mapState = 'locked'
      } else if (toNonNegativeInteger(task.percent) >= 100) {
        mapState = 'completed'
      } else if (UNLOCK_ALL_TASKS_FOR_DEV || !activeAssigned) {
        mapState = 'active'
        if (!UNLOCK_ALL_TASKS_FOR_DEV) {
          activeAssigned = true
        }
      }

      return decorateTaskVisual(Object.assign({}, task, {
        mapState,
        mapPosition: MAP_POSITIONS[index % MAP_POSITIONS.length]
      }))
    })

    let mapState = unit.locked ? 'locked' : 'upcoming'
    if (tasks.length && tasks.every(task => task.mapState === 'completed')) {
      mapState = 'completed'
    } else if (tasks.some(task => task.mapState === 'active')) {
      mapState = 'active'
    }

    return Object.assign({}, unit, {
      mapState,
      tasks
    })
  })

  return mappedUnits.map((unit, index) => {
    const mapLane = getMapLane(index)
    const nextLane = index < mappedUnits.length - 1 ? getMapLane(index + 1) : ''
    const hasMonster = hasMonsterAt(index)
    const monsterState = hasMonster ? getMonsterState(unit.mapState) : ''
    const monsterName = hasMonster ? getMonsterName(index) : ''
    const cardMonsterName = MAP_MONSTER_NAMES[index % MAP_MONSTER_NAMES.length]
    const cardMonsterState = getMonsterState(unit.mapState)

    return Object.assign({}, unit, {
      mapLane,
      mapButton: getMapButton(unit.mapState),
      hasConnector: index < mappedUnits.length - 1,
      connectorClass: nextLane ? mapLane + '-' + nextLane : '',
      hasMonster,
      monsterName,
      monsterState,
      monsterSide: hasMonster ? getMonsterSide(mapLane, index) : '',
      monsterSprite: hasMonster ? buildMonsterSprite(monsterName, monsterState) : '',
      monsterDuration: hasMonster ? getMonsterDuration(monsterState) : 0,
      monsterFrameCount: hasMonster ? getMonsterFrameCount(monsterState) : 1,
      monsterFrameSize: MAP_MONSTER_FRAME_SIZE,
      cardMonsterName,
      cardMonsterState,
      cardMonsterSprite: buildMonsterSprite(cardMonsterName, cardMonsterState),
      cardMonsterDuration: getMonsterDuration(cardMonsterState),
      cardMonsterFrameCount: getMonsterFrameCount(cardMonsterState),
      cardMonsterFrameSize: CARD_MONSTER_FRAME_SIZE
    })
  })
}

function buildDisplayUnits(apiUnits, fallbackUnits) {
  const source = Array.isArray(apiUnits) ? apiUnits : []
  if (!source.length) {
    const fallback = Array.isArray(fallbackUnits) ? fallbackUnits : []
    return decorateMapProgress(
      fallback.map(buildFallbackDisplayUnit).map(applyFirstUnitDemoCompletion)
    )
  }

  const units = source
    .map((unit, index) => ({
      index,
      display: buildDisplayUnit(unit || {}, index)
    }))
    .sort((left, right) => left.display.sort - right.display.sort || left.index - right.index)
    .map(item => item.display)

  return decorateMapProgress(units.map(applyFirstUnitDemoCompletion))
}

function buildMapSections(units) {
  const source = Array.isArray(units) ? units : []
  const sections = []

  for (let start = 0; start < source.length; start += MAP_SECTION_SIZE) {
    const sectionIndex = Math.floor(start / MAP_SECTION_SIZE)
    const sectionUnits = source.slice(start, start + MAP_SECTION_SIZE)
    const firstSort = sectionUnits[0] ? sectionUnits[0].sort : start + 1
    const lastSort = sectionUnits[sectionUnits.length - 1]
      ? sectionUnits[sectionUnits.length - 1].sort
      : firstSort

    sections.push({
      sectionIndex,
      stageNumber: sectionIndex + 1,
      title: getMapSectionTheme(sectionIndex),
      subtitle: '第 ' + firstSort + '-' + lastSort + ' 关',
      background: MAP_SECTION_BACKGROUND,
      totalCount: sectionUnits.length,
      completedCount: sectionUnits.filter(unit => unit.mapState === 'completed').length,
      units: sectionUnits.map((unit, localIndex) => Object.assign({}, unit, {
        sectionSlot: localIndex,
        mapGlobalIndex: start + localIndex
      }))
    })
  }

  return sections
}

function getConnectorState(state) {
  if (state === 'completed') {
    return 'completed'
  }
  if (state === 'active') {
    return 'active'
  }
  return 'upcoming'
}

// Flatten decorated units into a single top-to-bottom闯关 trail. Every level
// contributes five stops: a signpost路牌, three task nodes, and a boss小怪兽.
function buildMapTrail(units) {
  const source = Array.isArray(units) ? units : []
  const stops = []

  source.forEach((unit, unitIndex) => {
    const tasks = Array.isArray(unit.tasks) ? unit.tasks : []
    const monsterName = MAP_MONSTER_NAMES[unitIndex % MAP_MONSTER_NAMES.length]
    const monsterState = getMonsterState(unit.mapState)

    stops.push({
      kind: 'signpost',
      unitGlobalIndex: unitIndex,
      sort: unit.sort,
      levelWords: toNonNegativeInteger(unit.levelWords),
      subtitleEnglish: unit.subtitleEnglish || '',
      subtitleChinese: unit.subtitleChinese || '',
      state: unit.mapState || (unit.locked ? 'locked' : 'upcoming'),
      offset: TRAIL_OFFSETS.signpost
    })

    TRAIL_TASK_ORDER.forEach(type => {
      const task = tasks.find(item => item.type === type) || {}
      const state = task.mapState || (unit.locked ? 'locked' : 'upcoming')
      stops.push({
        kind: 'task',
        taskType: type,
        unitGlobalIndex: unitIndex,
        label: task.label || '',
        icon: task.icon || '',
        color: task.color || '',
        percent: toNonNegativeInteger(task.percent),
        state,
        mapButton: getMapButton(state),
        offset: TRAIL_OFFSETS[type]
      })
    })

    stops.push({
      kind: 'monster',
      unitGlobalIndex: unitIndex,
      monsterName,
      monsterState,
      monsterSprite: buildMonsterSprite(monsterName, monsterState),
      monsterDuration: getMonsterDuration(monsterState),
      monsterFrameCount: getMonsterFrameCount(monsterState),
      monsterFrameSize: MAP_MONSTER_FRAME_SIZE,
      state: unit.mapState || (unit.locked ? 'locked' : 'upcoming'),
      offset: TRAIL_OFFSETS.monster
    })
  })

  return stops.map((stop, index) => {
    const next = stops[index + 1]
    const centerX = TRAIL_CENTER_X + stop.offset
    const half = stop.kind === 'monster' ? TRAIL_MONSTER_HALF : TRAIL_TASK_HALF

    let connector = null
    if (next) {
      const dx = next.offset - stop.offset
      const dy = TRAIL_ROW_HEIGHT
      connector = {
        length: Math.round(Math.sqrt(dx * dx + dy * dy)),
        angle: Math.round(Math.atan2(dy, dx) * 180 / Math.PI * 100) / 100,
        state: getConnectorState(next.state)
      }
    }

    return Object.assign({}, stop, {
      stopIndex: index,
      centerX,
      nodeLeft: centerX - half,
      connector
    })
  })
}

function getNextVisibleCount(total, current, batchSize) {
  const totalCount = toNonNegativeInteger(total)
  const currentCount = Math.min(toNonNegativeInteger(current), totalCount)
  const size = toNonNegativeInteger(batchSize) || DISPLAY_BATCH_SIZE
  return Math.min(currentCount + size, totalCount)
}

// List (category) mode inserts a review level after every REVIEW_INTERVAL real
// levels, producing a fixed sequence of 3 new → 1 review → 3 new → 1 review …
// The「每天练习几组」goal counts every card the same — a review consumes a goal
// slot just like a level, and a review the goal doesn't reach falls into the
// next batch (see markTodayTasks).
// A review card reuses the regular unit-card layout — same structure — but its
// content is the words the learner previously got wrong across the preceding
// three levels.
const REVIEW_INTERVAL = 3
const REVIEW_STAGE_COLOR = '#ff7a1a'
const REVIEW_SAYING = {
  english: 'Review makes memory stronger.',
  chinese: '复习让记忆更牢固。'
}
const REVIEW_TASK_LABELS = {
  word: '错词重学',
  recitation: '错词跟读',
  listening: '错词听力'
}

function isUnitCompleted(unit) {
  if (unit.mapState) {
    return unit.mapState === 'completed'
  }
  return Math.min(toNonNegativeInteger(unit.doneStages), 3) >= 3
}

// Words a learner still needs to review from a level. Prefer an explicit count
// from the backend; otherwise fall back to the level's word pool so the review
// card is never empty.
function getWrongWordTotal(unit) {
  const wrong = toNonNegativeInteger(unit.wrongWords)
  return wrong > 0 ? wrong : toNonNegativeInteger(unit.levelWords)
}

function buildReviewUnit(groupUnits, ordinal, listIndex) {
  const group = Array.isArray(groupUnits) ? groupUnits : []
  const reviewWords = group.reduce((sum, unit) => sum + getWrongWordTotal(unit), 0)
  const groupCompleted = group.length > 0 && group.every(isUnitCompleted)
  // Two reasons a review can be locked: it covers paid (VIP) levels, or its
  // preceding levels just aren't finished yet. Only the former should exclude it
  // from today's plan — a pending review is still the next planned step.
  const lockedByVip = group.some(unit => unit.locked)
  const locked = lockedByVip || !groupCompleted
  const mapState = lockedByVip ? 'locked' : (groupCompleted ? 'active' : 'upcoming')
  const monsterName = MAP_MONSTER_NAMES[listIndex % MAP_MONSTER_NAMES.length]
  const monsterState = getMonsterState(mapState)
  const firstSort = group.length ? group[0].sort : ordinal
  const lastSort = group.length ? group[group.length - 1].sort : firstSort
  const reviewUnitIds = group.map(unit => unit.unitId).filter(Boolean)
  let activeAssigned = false

  const tasks = TASK_DEFINITIONS.map(definition => {
    let taskMapState = 'upcoming'
    if (!locked && (UNLOCK_ALL_TASKS_FOR_DEV || !activeAssigned)) {
      taskMapState = 'active'
      if (!UNLOCK_ALL_TASKS_FOR_DEV) {
        activeAssigned = true
      }
    }

    return decorateTaskVisual({
      type: definition.type,
      label: REVIEW_TASK_LABELS[definition.type] || definition.label,
      icon: definition.icon,
      color: definition.color,
      current: 0,
      total: reviewWords,
      percent: 0,
      mapState: taskMapState
    })
  })

  return {
    isReview: true,
    key: 'review-' + ordinal,
    sort: lastSort,
    levelWords: reviewWords,
    reviewWords,
    reviewUnitIds,
    reviewRange: '第 ' + firstSort + '-' + lastSort + ' 关',
    title: '复习 · 错词巩固 · ' + reviewWords + '词',
    subtitle: REVIEW_SAYING.english,
    subtitleEnglish: REVIEW_SAYING.english,
    subtitleChinese: REVIEW_SAYING.chinese,
    subtitleLanguage: 'en',
    subtitleColor: REVIEW_STAGE_COLOR,
    stageColor: REVIEW_STAGE_COLOR,
    locked,
    lockedByVip,
    doneStages: 0,
    stageStars: buildStageStars(0),
    tasks,
    cardMonsterName: monsterName,
    cardMonsterState: monsterState,
    cardMonsterSprite: buildMonsterSprite(monsterName, monsterState),
    cardMonsterDuration: getMonsterDuration(monsterState),
    cardMonsterFrameCount: getMonsterFrameCount(monsterState),
    cardMonsterFrameSize: CARD_MONSTER_FRAME_SIZE
  }
}

function buildListUnits(units) {
  const source = Array.isArray(units) ? units : []
  const result = []
  let group = []
  let reviewOrdinal = 0

  source.forEach(unit => {
    result.push(Object.assign({ key: 'unit-' + unit.sort, isReview: false }, unit))
    group.push(unit)
    if (group.length === REVIEW_INTERVAL) {
      reviewOrdinal += 1
      result.push(buildReviewUnit(group, reviewOrdinal, result.length))
      group = []
    }
  })

  return result
}

// Flag the next `goal` cards along the learning sequence as today's targets so
// the path can box them up under「今日要学」. A review card is a normal step in
// the sequence and consumes a goal slot just like a level — a goal of 2 always
// boxes up exactly 2 cards. When the goal runs out before reaching a review,
// the review simply belongs to the next batch (e.g. tomorrow's plan).
// Completed levels and VIP-locked content never count (the batch advances as
// levels get finished). A pending review (its levels not finished yet) still
// counts as a planned step, but a VIP-locked review is excluded.
function markTodayTasks(listUnits, goal) {
  const target = toNonNegativeInteger(goal)
  let marked = 0

  return (Array.isArray(listUnits) ? listUnits : []).map(unit => {
    const eligible = unit.isReview
      ? !unit.lockedByVip
      : (!unit.locked && unit.mapState !== 'completed')
    const isTodayTask = eligible && marked < target
    if (isTodayTask) {
      marked += 1
    }
    return Object.assign({}, unit, { isTodayTask })
  })
}

// Collapse the flat list into render groups so consecutive「今日要学」levels can
// share one container card, while every other level renders on its own. Each
// entry carries the unit's original listUnits index so tap/toggle handlers keep
// indexing the source array regardless of grouping.
function groupListUnits(listUnits) {
  const source = Array.isArray(listUnits) ? listUnits : []
  const groups = []
  let todayGroup = null

  source.forEach((unit, index) => {
    const entry = Object.assign({}, unit, { listIndex: index })
    if (entry.isTodayTask) {
      if (!todayGroup) {
        todayGroup = { key: 'today-' + index, today: true, units: [] }
        groups.push(todayGroup)
      }
      todayGroup.units.push(entry)
    } else {
      todayGroup = null
      groups.push({ key: 'single-' + entry.key, today: false, unit: entry })
    }
  })

  return groups
}

module.exports = {
  UNLOCK_ALL_TASKS_FOR_DEV,
  DISPLAY_BATCH_SIZE,
  REVIEW_INTERVAL,
  buildDisplayUnits,
  buildListUnits,
  markTodayTasks,
  groupListUnits,
  buildMapSections,
  buildMapTrail,
  getNextVisibleCount
}
