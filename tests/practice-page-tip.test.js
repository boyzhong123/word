const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const projectRoot = path.resolve(__dirname, '..')
const practiceScript = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.js'), 'utf8')
const practiceStyle = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.wxss'), 'utf8')

function loadPracticeTipHelpers() {
  const context = {
    module: { exports: {} },
    exports: {},
    require: () => ({}),
    Page: () => {},
    wx: {
      getStorageSync: () => ({}),
      nextTick: () => {}
    },
    Math: Math
  }
  const script = practiceScript
    .replace(/^Page\(\{[\s\S]*$/m, '')
    .concat('\nmodule.exports = { getPageTipPosition };')
  vm.runInNewContext(script, context)
  return context.module.exports
}

test('page-number tip stays below the navigation progress area', () => {
  const { getPageTipPosition } = loadPracticeTipHelpers()
  const position = getPageTipPosition(
    { top: 164, left: 72, width: 23, height: 23 },
    { height: 52 },
    { bottom: 146 }
  )

  assert.equal(position.top, 154)
  assert.equal(position.left, 77)
})

test('page-number tip layer sits above the practice navigation', () => {
  assert.match(practiceStyle, /\.anchor-page-tip\s*{[^}]*z-index:\s*120/s)
})

test('page-number tip tap hides the anchor-page axis state', () => {
  assert.match(practiceScript, /anchor === 'anchor-page-tip'/)
  assert.match(practiceScript, /anchor = 'anchor-page'/)
})
