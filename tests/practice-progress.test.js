const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const projectRoot = path.resolve(__dirname, '..')
const practiceScript = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.js'), 'utf8')
const practiceTemplate = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.wxml'), 'utf8')
const practiceWxs = fs.readFileSync(path.join(projectRoot, 'pages/practice-progress.wxs'), 'utf8')

function loadPracticeProgressHelpers() {
  const context = {
    module: { exports: {} },
    exports: {},
    Math: Math
  }
  vm.runInNewContext(practiceWxs, context)
  return context.module.exports
}

function loadPracticeJsHelpers() {
  const context = {
    module: { exports: {} },
    exports: {},
    require: () => ({}),
    Page: () => {},
    wx: {
      getStorageSync: () => ({}),
      nextTick: () => {}
    }
  }
  const script = practiceScript
    .replace(/^Page\(\{[\s\S]*$/m, '')
    .concat('\nmodule.exports = { getPracticeProgressRatio, getPracticeProgressPercent };')
  vm.runInNewContext(script, context)
  return context.module.exports
}

test('wxs progress track style reflects 16/27 as a partial fill', () => {
  const wxs = loadPracticeProgressHelpers()
  assert.equal(wxs.getPercent(15, 27), 59)
  assert.equal(
    wxs.getTrackStyle(15, 27),
    'background:linear-gradient(to right, #111318 59%, rgba(255,255,255,0.36) 59%);'
  )
})

test('practice wxml binds progress directly to current and wordTotal', () => {
  assert.match(practiceTemplate, /practice-progress\.wxs/)
  assert.match(practiceTemplate, /practiceProgress\.getTrackStyle\(current, wordTotal\)/)
  assert.doesNotMatch(practiceTemplate, /practice-top-progress-fill/)
})

test('practice js keeps wordTotal for progress rendering', () => {
  assert.match(practiceScript, /wordTotal:\s*wordTotal/)
  assert.match(practiceScript, /getPracticeProgressPercent/)
  const helpers = loadPracticeJsHelpers()
  assert.equal(helpers.getPracticeProgressPercent(15, 27), 59)
})
