const test = require('node:test')
const assert = require('node:assert/strict')
const {
  computeScrollTopToAlignTarget,
  computeScrollTopToCenterTarget
} = require('../pages/home/home-scroll')

test('computeScrollTopToAlignTarget aligns target top with scroll viewport top', () => {
  const targetTop = computeScrollTopToAlignTarget(320, { top: 180, height: 420 }, { top: 0, height: 700 })
  assert.equal(targetTop, 500)
})

test('computeScrollTopToAlignTarget scrolls up when today section is above viewport', () => {
  const targetTop = computeScrollTopToAlignTarget(900, { top: -240, height: 420 }, { top: 0, height: 700 })
  assert.equal(targetTop, 660)
})

test('computeScrollTopToCenterTarget keeps extra content above the target', () => {
  const centeredTop = computeScrollTopToCenterTarget(900, { top: -240, height: 420 }, { top: 0, height: 700 })
  const alignedTop = computeScrollTopToAlignTarget(900, { top: -240, height: 420 }, { top: 0, height: 700 })
  assert.ok(centeredTop < alignedTop)
})
