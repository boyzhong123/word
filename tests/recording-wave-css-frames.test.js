const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { CSS_FRAME_COUNT, CSS_TILE_WIDTH } = require('../utils/recording-wave-math')

const framesSvg = fs.readFileSync(
  path.join(__dirname, '../images/listen/recording-wave-css-frames.svg'),
  'utf8'
)

test('recording wave css frames sprite has 30 phased frames', () => {
  const groups = framesSvg.match(/<g transform="translate\(/g) || []
  assert.equal(groups.length, CSS_FRAME_COUNT)
  assert.match(framesSvg, new RegExp('width="' + (CSS_TILE_WIDTH * CSS_FRAME_COUNT) + '"'))
  assert.match(framesSvg, /stroke="#2f80ed"/)
  assert.match(framesSvg, /stroke="#9fc3f5"/)
})
