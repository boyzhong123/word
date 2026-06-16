const test = require('node:test')
const assert = require('node:assert/strict')
const {
  gradeText,
  tierText,
  toneColor,
  encourageText
} = require('../utils/exam-report-copy')
const { unitEncourageText } = require('../utils/report-copy')

test('gradeText maps total accuracy to badge labels', () => {
  assert.equal(gradeText(90), '优秀')
  assert.equal(gradeText(89), '良好')
  assert.equal(gradeText(75), '良好')
  assert.equal(gradeText(74), '及格')
  assert.equal(gradeText(60), '及格')
  assert.equal(gradeText(59), '待加强')
})

test('tierText maps section accuracy to status labels', () => {
  assert.equal(tierText(80), '掌握')
  assert.equal(tierText(79), '较好')
  assert.equal(tierText(50), '较好')
  assert.equal(tierText(49), '待练')
})

test('toneColor maps accuracy to bar colors', () => {
  assert.equal(toneColor(80), '#22c55e')
  assert.equal(toneColor(50), '#f59e0b')
  assert.equal(toneColor(49), '#ef4444')
})

test('encourageText for entry exam by score band', () => {
  assert.equal(encourageText('entry', 85, null), '基础很扎实，按计划学习会更稳。')
  assert.equal(encourageText('entry', 84, null), '已有不错的基础，正是提升的好时机。')
  assert.equal(encourageText('entry', 60, null), '已有不错的基础，正是提升的好时机。')
  assert.equal(encourageText('entry', 59, null), '别担心，这正是开始的地方，一起加油！')
})

test('encourageText for exit exam compares against entry when delta provided', () => {
  assert.equal(encourageText('exit', 86, 5), '相比入门测进步明显，继续保持！')
  assert.equal(encourageText('exit', 86, -3), '状态有波动，把错题再巩固一遍就好。')
  assert.equal(encourageText('exit', 86, 0), '水平保持稳定，挑战更高目标吧！')
  assert.equal(encourageText('exit', 70, 0), '整体表现平稳，把错题练熟还能再上分。')
  assert.equal(encourageText('exit', 50, 0), '基础还需打牢，从错题入手一步步提升。')
})

test('encourageText for exit without entry compare falls back to entry-style copy', () => {
  assert.equal(encourageText('exit', 86, null), '基础很扎实，按计划学习会更稳。')
  assert.equal(encourageText('exit', 70, undefined), '已有不错的基础，正是提升的好时机。')
})

test('unitEncourageText for level report by score and review count', () => {
  assert.equal(unitEncourageText(95, 0), '近乎满分，太棒啦！')
  assert.equal(unitEncourageText(85, 3), '表现很棒，再巩固一下错词就更稳了。')
  assert.equal(unitEncourageText(70, 2), '把 2 个错词再练一练，正确率还能往上冲。')
  assert.equal(unitEncourageText(70, 0), '稳扎稳打，继续加油！')
})
