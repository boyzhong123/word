const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
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

function fileHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

test('pk source frames and sprite sheet exist for seven-frame playback', () => {
  framePaths.forEach(framePath => {
    assert.equal(fs.existsSync(framePath), true, framePath + ' should exist')
  })
  assert.equal(fs.existsSync(spritePath), true)
  assert.equal(fs.existsSync(path.join(projectRoot, 'images/home/student-monster-pk-sprite-girl.png')), true)
  // 3x assets displayed at 148x84 rpx via the frame-animation background-size
  assert.deepEqual(readPngSize(spritePath), {
    width: 444 * 7,
    height: 252
  })
  assert.deepEqual(readPngSize(path.join(projectRoot, 'images/home/student-monster-pk-sprite-girl.png')), {
    width: 444 * 7,
    height: 252
  })
})

test('pk sprite upload mirrors match local runtime sprites', () => {
  const spriteNames = [
    'student-monster-pk-sprite.png',
    'student-monster-pk-sprite-girl.png'
  ]

  spriteNames.forEach(spriteName => {
    const localPath = path.join(projectRoot, 'images/home', spriteName)
    const mirrorPath = path.join(projectRoot, 'vercel-assets/images/home', spriteName)
    assert.equal(fs.existsSync(mirrorPath), true)
    assert.equal(fileHash(mirrorPath), fileHash(localPath))
  })
})

test('home page references the seven-frame pk sprite timing', () => {
  const homeTemplate = fs.readFileSync(path.join(projectRoot, 'pages/home/home.wxml'), 'utf8')
  assert.match(homeTemplate, /pkSpriteUrl/)
  assert.match(homeTemplate, /count="7"/)
  assert.match(homeTemplate, /duration="{{pkSpriteDuration}}"/)
})
