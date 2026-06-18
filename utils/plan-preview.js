const LEVEL_SIZE = 10
const INITIAL_LEVEL_COUNT = 5

const PLAN_MASCOT = {
  easy: {
    mood: 'easy',
    label: '很轻松',
    desc: '每天练一点，节奏很舒服',
    image: '../../images/plan/plan-mascot-easy.png'
  },
  normal: {
    mood: 'normal',
    label: '正常节奏',
    desc: '标准强度，坚持下去就好',
    image: '../../images/plan/plan-mascot-normal.png'
  },
  hard: {
    mood: 'hard',
    label: '有点苦恼',
    desc: '任务偏多，记得适当休息',
    image: '../../images/plan/plan-mascot-hard.png'
  }
}

function buildPlanMascot(groupsPerDay) {
  const groups = Math.max(1, Math.floor(groupsPerDay))
  if (groups <= 2) {
    return PLAN_MASCOT.easy
  }
  if (groups <= 4) {
    return PLAN_MASCOT.normal
  }
  return PLAN_MASCOT.hard
}

function buildDisplayLevels(levelList, levelsExpanded) {
  if (!Array.isArray(levelList) || !levelList.length) {
    return []
  }
  if (levelsExpanded || levelList.length <= INITIAL_LEVEL_COUNT) {
    return levelList
  }
  return levelList.slice(0, INITIAL_LEVEL_COUNT)
}

function buildLevelViewState(levelList, levelsExpanded) {
  return {
    displayLevels: buildDisplayLevels(levelList, levelsExpanded),
    canExpandLevels: Array.isArray(levelList) &&
      levelList.length > INITIAL_LEVEL_COUNT &&
      !levelsExpanded,
    canCollapseLevels: levelsExpanded && levelList.length > INITIAL_LEVEL_COUNT
  }
}

module.exports = {
  LEVEL_SIZE,
  INITIAL_LEVEL_COUNT,
  PLAN_MASCOT,
  buildPlanMascot,
  buildDisplayLevels,
  buildLevelViewState
}
