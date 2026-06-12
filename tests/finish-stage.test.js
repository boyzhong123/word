const test = require('node:test')
const assert = require('node:assert/strict')
const {
  getStageInfo,
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
