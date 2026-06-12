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

function normalizeTaskType(taskType) {
  if (taskType === 'word' || taskType === 'recitation' || taskType === 'listening') {
    return taskType
  }
  return 'recitation'
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

  if (stage.nextType === 'recitation') {
    return '../practice/practice?resBookId=' + resBookId +
      '&unitId=' + unitId +
      '&name=' + bookName +
      '&taskType=recitation'
  }

  if (stage.nextType === 'listening') {
    return '/pages/listen/listen?resBookId=' + resBookId +
      '&unitId=' + unitId +
      '&mode=quiz' +
      '&name=' + bookName
  }

  if (stage.nextType === 'nextUnit' && options.nextUnitId) {
    return '../practice/practice?resBookId=' + resBookId +
      '&unitId=' + options.nextUnitId +
      '&name=' + bookName +
      '&taskType=word'
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
  normalizeTaskType,
  getStageInfo,
  buildContinueUrl,
  hasContinueAction
}
