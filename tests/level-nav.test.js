const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const {
  buildLevelNav,
  buildLevelNavTitle,
  buildLevelNavSubtitle
} = require(path.join(projectRoot, 'utils/level-nav'))
const practiceScript = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.js'), 'utf8')
const practiceTemplate = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.wxml'), 'utf8')
const listenScript = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.js'), 'utf8')
const listenTemplate = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.wxml'), 'utf8')

test('level nav helpers format title and subtitle separately', () => {
  assert.equal(buildLevelNavTitle(2), '关卡2')
  assert.equal(buildLevelNavSubtitle(1, 10), '2/10')
  assert.deepEqual(buildLevelNav({ unit: { sort: 3 } }, 0, 12), {
    navTitle: '关卡3',
    navSubtitle: '1/12'
  })
  assert.deepEqual(buildLevelNav({ unit: { sort: 0, unitName: '错词复习' } }, 4, 8, { review: true }), {
    navTitle: '错词复习',
    navSubtitle: '5/8'
  })
})

test('practice page renders level title and progress subtitle', () => {
  assert.match(practiceScript, /buildLevelNav/)
  assert.match(practiceScript, /navSubtitle/)
  assert.match(practiceTemplate, /nav-title/)
  assert.match(practiceTemplate, /nav-subtitle/)
  assert.doesNotMatch(practiceTemplate, /第\d+期/)
})

test('listen quiz page renders level title and progress subtitle', () => {
  assert.match(listenScript, /getQuizNavMeta/)
  assert.match(listenScript, /buildLevelNavTitle/)
  assert.match(listenTemplate, /quizMode/)
  assert.match(listenTemplate, /navTitle/)
  assert.match(listenTemplate, /navSubtitle/)
})
