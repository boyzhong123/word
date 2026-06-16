const test = require('node:test')
const assert = require('node:assert/strict')
const {
  getStageInfo,
  buildStageProgress,
  buildSubSteps,
  buildContinueUrl,
  hasContinueAction,
  normalizeTaskType
} = require('../utils/finish-stage')

test('finish stage labels map word to recitation and recitation to listening', () => {
  assert.equal(getStageInfo('word').continueLabel, '继续跟读背诵')
  assert.equal(getStageInfo('recitation').continueLabel, '继续关卡小测')
  assert.equal(getStageInfo('listening').continueLabel, '继续学习')
})

test('finish stage continue urls route to the next learning step', () => {
  const base = {
    resBookId: 'book-1',
    unitId: '42',
    bookName: '小学英语'
  }

  assert.match(
    buildContinueUrl(Object.assign({}, base, { taskType: 'word' })),
    /taskType=recitation/
  )
  assert.match(
    buildContinueUrl(Object.assign({}, base, { taskType: 'recitation' })),
    /mode=quiz/
  )
  assert.match(
    buildContinueUrl(Object.assign({}, base, {
      taskType: 'listening',
      nextUnitId: '43'
    })),
    /unitId=43&name=%E5%B0%8F%E5%AD%A6%E8%8B%B1%E8%AF%AD&taskType=word/
  )
})

test('finish stage hides continue when listening has no next unit', () => {
  assert.equal(hasContinueAction('word', null), true)
  assert.equal(hasContinueAction('recitation', null), true)
  assert.equal(hasContinueAction('listening', null), false)
  assert.equal(hasContinueAction('listening', '43'), true)
})

test('finish stage normalizes unknown task types to recitation', () => {
  assert.equal(normalizeTaskType(undefined), 'recitation')
  assert.equal(getStageInfo(undefined).title, '完成跟读背诵!')
})

test('sub steps mark prior steps done, current step current, later upcoming', () => {
  const steps = buildSubSteps('recitation')
  assert.deepEqual(steps.map(step => step.state), ['done', 'current', 'upcoming'])
  assert.deepEqual(steps.map(step => step.lineState), ['done', 'done', 'upcoming'])
})

test('stage progress uses 关卡/环节 copy instead of 期', () => {
  const word = buildStageProgress({ taskType: 'word', unitSort: 1, unitCount: 143 })
  assert.equal(word.summaryTitle, '关卡 1 · 已完成 1/3 环节')
  assert.match(word.summarySub, /跟读背诵、关卡小测/)
  assert.equal(word.isUnitComplete, false)

  const recitation = buildStageProgress({ taskType: 'recitation', unitSort: 2, unitCount: 143 })
  assert.equal(recitation.summaryTitle, '关卡 2 · 已完成 2/3 环节')
})

test('stage progress treats 关卡小测 as full level clear with book progress', () => {
  const clear = buildStageProgress({ taskType: 'listening', unitSort: 1, unitCount: 143 })
  assert.equal(clear.isUnitComplete, true)
  assert.equal(clear.summaryTitle, '关卡 1 全部通关！')
  assert.equal(clear.summarySub, '再通关 142 关就学完本书')

  const last = buildStageProgress({ taskType: 'listening', unitSort: 143, unitCount: 143 })
  assert.equal(last.summarySub, '太棒了，已学完本书全部关卡')
})
