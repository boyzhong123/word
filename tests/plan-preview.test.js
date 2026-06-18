const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const {
  buildPlanMascot,
  buildDisplayLevels,
  buildLevelViewState,
  INITIAL_LEVEL_COUNT,
  PLAN_MASCOT
} = require('../utils/plan-preview')

const projectRoot = path.resolve(__dirname, '..')

function readPage(page, ext) {
  return fs.readFileSync(path.join(projectRoot, 'pages', page, page + '.' + ext), 'utf8')
}

test('plan mascot mood follows daily group count bands', () => {
  assert.equal(buildPlanMascot(1).mood, 'easy')
  assert.equal(buildPlanMascot(2).image, PLAN_MASCOT.easy.image)
  assert.equal(buildPlanMascot(3).mood, 'normal')
  assert.equal(buildPlanMascot(4).label, '正常节奏')
  assert.equal(buildPlanMascot(5).mood, 'hard')
  assert.equal(buildPlanMascot(8).image, PLAN_MASCOT.hard.image)
})

test('plan level preview can expand to show all levels', () => {
  const levelList = Array.from({ length: 12 }, (_, index) => ({ sort: index + 1 }))
  const collapsed = buildLevelViewState(levelList, false)

  assert.equal(collapsed.displayLevels.length, INITIAL_LEVEL_COUNT)
  assert.equal(collapsed.canExpandLevels, true)
  assert.equal(collapsed.canCollapseLevels, false)

  const expanded = buildLevelViewState(levelList, true)
  assert.equal(expanded.displayLevels.length, 12)
  assert.equal(expanded.canExpandLevels, false)
  assert.equal(expanded.canCollapseLevels, true)
  assert.deepEqual(buildDisplayLevels(levelList, true), levelList)
})

test('plan page exposes mascot row and expand-all levels UI', () => {
  const template = readPage('plan', 'wxml')
  const style = readPage('plan', 'wxss')

  assert.match(template, /class="daily-mascot-icon daily-mascot-icon-{{planMascot\.mood}}"/)
  assert.match(template, /{{planMascot\.image}}/)
  assert.match(template, /class="preset-track"/)
  assert.match(template, /preset-seg-active/)
  assert.match(template, /bindtap="expandLevels"/)
  assert.match(template, /bindtap="collapseLevels"/)
  assert.match(template, /displayLevels/)
  assert.match(style, /\.daily-mascot-icon\s*{/)
  assert.match(style, /\.preset-track\s*{/)
  assert.match(style, /\.level-more-action\s*{/)
})
