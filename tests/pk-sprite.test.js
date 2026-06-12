const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const spritePath = path.join(projectRoot, 'images/home/student-monster-pk-sprite.png')
const framePaths = [
  'student-monster-pk-frame-01.png',
  'student-monster-pk-anim-frame-02.png',
  'student-monster-pk-anim-frame-03.png',
  'student-monster-pk-anim-frame-04.png',
  'student-monster-pk-anim-frame-05.png',
  'student-monster-pk-anim-frame-06.png',
  'student-monster-pk-anim-frame-07.png'
].map(name => path.join(projectRoot, 'assets/pk-build/frames', name))

function readPngSize(filePath) {
  const header = fs.readFileSync(filePath).subarray(0, 24)
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20)
  }
}

test('pk source frames and sprite sheet exist for seven-frame playback', () => {
  framePaths.forEach(framePath => {
    assert.equal(fs.existsSync(framePath), true, framePath + ' should exist')
  })
  assert.equal(fs.existsSync(spritePath), true)
  // 2x assets displayed at 148x84 rpx via the frame-animation background-size
  assert.deepEqual(readPngSize(spritePath), {
    width: 296 * 7,
    height: 168
  })
})

test('home page references the seven-frame pk sprite timing', () => {
  const homeTemplate = fs.readFileSync(path.join(projectRoot, 'pages/home/home.wxml'), 'utf8')
  assert.match(homeTemplate, /student-monster-pk-sprite\.png/)
  assert.match(homeTemplate, /count="7"/)
  assert.match(homeTemplate, /duration="1\.75"/)
})
