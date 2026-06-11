const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const tabBarScript = fs.readFileSync(path.join(projectRoot, 'custom-tab-bar/index.js'), 'utf8')
const tabBarTemplate = fs.readFileSync(path.join(projectRoot, 'custom-tab-bar/index.wxml'), 'utf8')

test('mini player subscribes to player.active and renders the progress track', () => {
  assert.match(tabBarScript, /miniActive:\s*s\.active/)
  assert.doesNotMatch(tabBarScript, /miniActive:\s*s\.started/)
  assert.match(tabBarTemplate, /class="mini-progress-track"/)
  assert.match(tabBarTemplate, /miniProgress/)
})
