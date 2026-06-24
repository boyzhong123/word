const { appendReturnTabQuery } = require('./return-tab')

const STAGES = [
  {
    type: 'word',
    title: '完成单词新学!',
    continueLabel: '继续跟读背诵',
    nextType: 'recitation'
  },
  {
    type: 'recitation',
    title: '完成跟读背诵!',
    continueLabel: '继续关卡小测',
    nextType: 'listening'
  },
  {
    type: 'listening',
    title: '完成关卡小测!',
    continueLabel: '继续学习',
    nextType: 'nextUnit'
  }
]

// 一个关卡固定的三个子关卡（环节），按学习顺序排列。
const SUB_LEVELS = [
  { type: 'word', label: '单词新学' },
  { type: 'recitation', label: '跟读背诵' },
  { type: 'listening', label: '关卡小测' }
]

function normalizeTaskType(taskType) {
  if (taskType === 'word' || taskType === 'recitation' || taskType === 'listening') {
    return taskType
  }
  return 'recitation'
}

// 当前刚完成的环节在三个子关卡中的下标（0/1/2）。
function getStepIndex(taskType) {
  const type = normalizeTaskType(taskType)
  const index = SUB_LEVELS.findIndex(item => item.type === type)
  return index === -1 ? 1 : index
}

// 步骤条数据：done=已通过，current=刚完成（高亮打勾），upcoming=待解锁。
function buildSubSteps(taskType) {
  const completedIndex = getStepIndex(taskType)
  return SUB_LEVELS.map((item, index) => {
    let state = 'upcoming'
    if (index < completedIndex) {
      state = 'done'
    } else if (index === completedIndex) {
      state = 'current'
    }
    return Object.assign({}, item, {
      state,
      lineState: index <= completedIndex ? 'done' : 'upcoming'
    })
  })
}

// 完成页中部文案 + 步骤条。围绕「关卡 / 环节」组织，不再使用「期」。
function buildStageProgress(options) {
  options = options || {}
  const completedIndex = getStepIndex(options.taskType)
  const stepNumber = completedIndex + 1
  const stepTotal = SUB_LEVELS.length
  const unitSort = Number(options.unitSort) || 0
  const unitCount = Number(options.unitCount) || 0
  const isUnitComplete = stepNumber >= stepTotal
  const remaining = Math.max(unitCount - unitSort, 0)

  let summaryTitle = ''
  let summarySub = ''

  if (isUnitComplete) {
    summaryTitle = '关卡 ' + unitSort + ' 全部通关！'
    summarySub = remaining > 0
      ? '再通关 ' + remaining + ' 关就学完本书'
      : '太棒了，已学完本书全部关卡'
  } else {
    const restLabels = SUB_LEVELS.slice(stepNumber).map(item => item.label).join('、')
    summaryTitle = '关卡 ' + unitSort + ' · 已完成 ' + stepNumber + '/' + stepTotal + ' 环节'
    summarySub = '继续完成' + restLabels + '即可通关本关'
  }

  return {
    subSteps: buildSubSteps(options.taskType),
    stepNumber,
    stepTotal,
    isUnitComplete,
    summaryTitle,
    summarySub
  }
}

function getStageInfo(taskType) {
  const type = normalizeTaskType(taskType)
  return STAGES.find(stage => stage.type === type) || STAGES[1]
}

function buildContinueUrl(options) {
  const stage = getStageInfo(options.taskType)
  const resBookId = encodeURIComponent(options.resBookId || '')
  const bookName = encodeURIComponent(options.bookName || '')
  const unitId = options.unitId || ''

  const returnTab = options.returnTab || ''

  if (stage.nextType === 'recitation') {
    return appendReturnTabQuery(
      '../practice/practice?resBookId=' + resBookId +
        '&unitId=' + unitId +
        '&name=' + bookName +
        '&taskType=recitation',
      returnTab
    )
  }

  if (stage.nextType === 'listening') {
    return appendReturnTabQuery(
      '/pages/listen/listen?resBookId=' + resBookId +
        '&unitId=' + unitId +
        '&mode=quiz' +
        '&name=' + bookName,
      returnTab
    )
  }

  if (stage.nextType === 'nextUnit' && options.nextUnitId) {
    return appendReturnTabQuery(
      '../practice/practice?resBookId=' + resBookId +
        '&unitId=' + options.nextUnitId +
        '&name=' + bookName +
        '&taskType=word',
      returnTab
    )
  }

  return ''
}

function hasContinueAction(taskType, nextUnitId) {
  const stage = getStageInfo(taskType)
  if (stage.nextType === 'nextUnit') {
    return Boolean(nextUnitId)
  }
  return true
}

module.exports = {
  STAGES,
  SUB_LEVELS,
  normalizeTaskType,
  getStageInfo,
  getStepIndex,
  buildSubSteps,
  buildStageProgress,
  buildContinueUrl,
  hasContinueAction
}
