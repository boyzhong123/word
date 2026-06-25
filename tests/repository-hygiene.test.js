const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const retiredPages = [
  'pages/index/index',
  'pages/advertisement/advertisement',
  'pages/vip/vip',
  'pages/me/pet'
]

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

test('retired pages are absent from the route graph and filesystem', () => {
  const appConfig = JSON.parse(read('app.json'))

  for (const page of retiredPages) {
    assert.ok(!appConfig.pages.includes(page), `${page} should not be registered`)
    for (const ext of ['js', 'json', 'wxml', 'wxss']) {
      assert.ok(
        !fs.existsSync(path.join(projectRoot, `${page}.${ext}`)),
        `${page}.${ext} should be removed`
      )
    }
  }
})

test('production code no longer references retired routes or pet rewards', () => {
  const files = [
    'pages/finish/today.js',
    'pages/finish/today.wxml',
    'pages/finish/today.wxss',
    'scripts/capture-mini-app-screenshots.mjs',
    'utils/image-host.js'
  ]
  const source = files.map(read).join('\n')

  assert.doesNotMatch(source, /pages\/(?:index\/index|advertisement\/advertisement|vip\/vip|me\/pet)/)
  assert.doesNotMatch(source, /pet-system|petReward|\/images\/pet\/|\/images\/home\/ad\//)
})

test('analytics tracking does not read retired userInfo or student storage fallbacks', () => {
  const utilSource = read('utils/util.js')

  assert.doesNotMatch(utilSource, /getStorageSync\(['"]userInfo['"]\)/)
  assert.doesNotMatch(utilSource, /getStorageSync\(['"]student['"]\)/)
  assert.match(utilSource, /getCharacterGender/)
  assert.match(utilSource, /getMembership/)
})
