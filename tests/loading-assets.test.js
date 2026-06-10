const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const spritePath = path.join(projectRoot, 'images/listen/loading-mascot-sprite.png')
const staticPath = path.join(projectRoot, 'images/listen/loading-mascot.png')

test('listen loading mascot sprite is a 6-frame horizontal sheet', () => {
  assert.ok(fs.existsSync(spritePath))
  assert.ok(fs.existsSync(staticPath))

  const { execFileSync } = require('node:child_process')
  const size = execFileSync('python3', [
    '-c',
    'from PIL import Image; im=Image.open("' + spritePath + '"); print(im.size[0], im.size[1])'
  ], { encoding: 'utf8' }).trim().split(' ').map(Number)

  assert.deepEqual(size, [960, 160])

  const alpha = execFileSync('python3', [
    '-c',
    'from PIL import Image; im=Image.open("' + spritePath + '"); print(im.mode, im.getchannel("A").getextrema()[0])'
  ], { encoding: 'utf8' }).trim().split(' ')

  assert.equal(alpha[0], 'RGBA')
  assert.equal(Number(alpha[1]), 0)
})
