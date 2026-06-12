const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const spriteNames = [
  'mascot-progress-sprite.png',
  'mascot-alert-sprite.png',
  'mascot-sleep-sprite.png'
]
const stageStarNames = [
  'stage-star-filled.png',
  'stage-star-empty.png'
]
const taskIconNames = [
  'task-word.png',
  'task-recitation.png',
  'task-listening.png'
]
const mapNodeNames = [
  'level-node-completed.png',
  'level-node-current.png',
  'level-node-upcoming.png',
  'level-node-locked.png'
]
const mapMonsterNames = ['jelly']
const mapMonsterStates = ['locked', 'fighting', 'defeated']
const mapMonsterFrameCounts = {
  locked: 1,
  fighting: 6,
  defeated: 1
}

function readPngSize(filePath) {
  const header = fs.readFileSync(filePath).subarray(0, 24)
  assert.equal(header.toString('ascii', 1, 4), 'PNG')
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20)
  }
}

for (const spriteName of spriteNames) {
  test(spriteName + ' contains four 212 by 125 frames', () => {
    const spritePath = path.join(projectRoot, 'images/home', spriteName)
    assert.equal(fs.existsSync(spritePath), true, spriteName + ' should exist')
    assert.deepEqual(readPngSize(spritePath), {
      width: 848,
      height: 125
    })
  })
}

test('seek-thumb-mascot-sprite.png contains three 320 by 213 progress thumb frames', () => {
  const spritePath = path.join(projectRoot, 'images/listen/seek-thumb-mascot-sprite.png')
  assert.equal(fs.existsSync(spritePath), true, 'seek-thumb mascot sprite should exist')
  assert.deepEqual(readPngSize(spritePath), {
    width: 960,
    height: 213
  })
  assert.equal(fs.readFileSync(spritePath)[25], 6, 'seek-thumb mascot sprite should use RGBA color type')
})

for (const frameIndex of [1, 2, 3]) {
  test('seek-thumb-mascot-' + frameIndex + '.png is a 320 by 213 transparent loop frame', () => {
    const framePath = path.join(projectRoot, 'images/listen', 'seek-thumb-mascot-' + frameIndex + '.png')
    assert.equal(fs.existsSync(framePath), true, 'seek-thumb mascot frame should exist')
    assert.deepEqual(readPngSize(framePath), {
      width: 320,
      height: 213
    })
    assert.equal(fs.readFileSync(framePath)[25], 6, 'seek-thumb mascot frame should use RGBA color type')
  })
}

for (const stageStarName of stageStarNames) {
  test(stageStarName + ' is a transparent PNG icon', () => {
    const starPath = path.join(projectRoot, 'images/home', stageStarName)
    assert.equal(fs.existsSync(starPath), true, stageStarName + ' should exist')
    const header = fs.readFileSync(starPath)
    assert.equal(header.toString('ascii', 1, 4), 'PNG')
    assert.equal(header[25], 6, stageStarName + ' should use RGBA color type')
  })
}

for (const taskIconName of taskIconNames) {
  test(taskIconName + ' is a calm 72 by 72 transparent task icon', () => {
    const iconPath = path.join(projectRoot, 'images/home', taskIconName)
    assert.equal(fs.existsSync(iconPath), true, taskIconName + ' should exist')
    assert.deepEqual(readPngSize(iconPath), {
      width: 72,
      height: 72
    })
    assert.equal(fs.readFileSync(iconPath)[25], 6, taskIconName + ' should use RGBA color type')
  })
}

for (const mapNodeName of mapNodeNames) {
  test(mapNodeName + ' is a 240 by 240 transparent map button', () => {
    const nodePath = path.join(projectRoot, 'images/home/map', mapNodeName)
    assert.equal(fs.existsSync(nodePath), true, mapNodeName + ' should exist')
    assert.deepEqual(readPngSize(nodePath), {
      width: 240,
      height: 240
    })
    assert.equal(fs.readFileSync(nodePath)[25], 6, mapNodeName + ' should use RGBA color type')
  })
}

for (const monsterName of mapMonsterNames) {
  for (const monsterState of mapMonsterStates) {
    const spriteName = monsterName + '-' + monsterState + '.png'
    test(spriteName + ' contains the expected 166 by 166 monster frames', () => {
      const spritePath = path.join(projectRoot, 'images/home/map/monsters', spriteName)
      assert.equal(fs.existsSync(spritePath), true, spriteName + ' should exist')
      const frameCount = mapMonsterFrameCounts[monsterState]
      assert.deepEqual(readPngSize(spritePath), {
        width: 166 * frameCount,
        height: 166
      })
      assert.equal(fs.readFileSync(spritePath)[25], 6, spriteName + ' should use RGBA color type')
    })
  }
}
