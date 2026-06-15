const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')

function read(file) {
  return fs.readFileSync(path.join(projectRoot, file), 'utf8')
}

function setupWxStorage() {
  const storage = {}
  global.wx = {
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    }
  }
  return storage
}

test('pet system awards daily study coins once per unit and records ledger details', () => {
  setupWxStorage()
  delete require.cache[require.resolve('../utils/pet-system')]
  const {
    awardStudyCoins,
    getWallet,
    getCoinLedger
  } = require('../utils/pet-system')

  const first = awardStudyCoins({
    unitId: 'unit-1',
    taskType: 'recitation',
    date: '2026-06-14',
    dailyGoalCompleted: true
  })
  const duplicate = awardStudyCoins({
    unitId: 'unit-1',
    taskType: 'recitation',
    date: '2026-06-14',
    dailyGoalCompleted: true
  })
  const second = awardStudyCoins({
    unitId: 'unit-2',
    taskType: 'listening',
    date: '2026-06-14',
    dailyGoalCompleted: false
  })

  assert.equal(first.awarded, 34)
  assert.equal(duplicate.awarded, 0)
  assert.equal(second.awarded, 10)
  assert.equal(getWallet().coins, 44)

  const ledger = getCoinLedger()
  assert.equal(ledger.length, 2)
  assert.equal(ledger[0].title, '完成今日学习')
  assert.equal(ledger[0].amount, 34)
  assert.match(ledger[0].detail, /每日目标达成/)
  assert.equal(ledger[1].title, '完成随身听')
})

test('pet system supports adoption, away state, restore cost, and local feature toggle', () => {
  setupWxStorage()
  delete require.cache[require.resolve('../utils/pet-system')]
  const {
    adoptPet,
    getPetCatalog,
    getPetState,
    setPetFeatureEnabled,
    getPetFeatureEnabled,
    restorePetWithCoins,
    spendCoins
  } = require('../utils/pet-system')

  const catalog = getPetCatalog()
  assert.deepEqual(catalog.map(group => group.stage), ['primary', 'middle', 'high'])
  for (const group of catalog) {
    assert.equal(group.pets.length, 3)
    assert.ok(group.pets.every(pet => pet.image && pet.sceneClass))
  }

  const adopted = adoptPet('middle', 'middle-coder-dog')
  assert.equal(adopted.stage, 'middle')
  assert.equal(adopted.variantId, 'middle-coder-dog')
  assert.equal(adopted.status, 'home')

  spendCoins(70, '测试扣金币', '让余额低于找回门槛')
  assert.equal(restorePetWithCoins().ok, false)

  spendCoins(-90, '测试补金币', '补足找回门槛')
  const restored = restorePetWithCoins()
  assert.equal(restored.ok, true)
  assert.equal(getPetState().status, 'home')

  setPetFeatureEnabled(false)
  assert.equal(getPetFeatureEnabled(), false)
})

test('pet pages are registered and the me page exposes only a floating pet entry', () => {
  const appConfig = JSON.parse(read('app.json'))
  const meScript = read('pages/me/me.js')
  const meTemplate = read('pages/me/me.wxml')
  const meStyle = read('pages/me/me.wxss')
  const petTemplate = read('pages/me/pet.wxml')
  const petStyle = read('pages/me/pet.wxss')

  assert.ok(appConfig.pages.includes('pages/me/pet'))
  for (const ext of ['js', 'json', 'wxml', 'wxss']) {
    assert.ok(fs.existsSync(path.join(projectRoot, `pages/me/pet.${ext}`)))
  }

  assert.match(meScript, /loadPetEntry/)
  assert.match(meScript, /goPetHome/)
  assert.match(meTemplate, /class="pet-fab/)
  assert.match(meStyle, /\.pet-fab\s*{/)
  assert.match(petTemplate, /金币明细/)
  assert.match(petTemplate, /wx:for="{{petGroups}}"/)
  assert.match(petTemplate, /class="pet-character .*{{pet.sceneClass}}/)
  assert.match(petStyle, /@keyframes petBounce/)
  assert.match(petStyle, /@keyframes petSleep/)
  assert.match(petStyle, /@keyframes petAway/)
  assert.doesNotMatch(meScript, /label: '我的宠物'/)
  assert.doesNotMatch(meTemplate, /金币明细/)
})

test('pet images are remote candidates and excluded from the mini program package', () => {
  const projectConfig = JSON.parse(read('project.config.json'))
  const imageHost = read('utils/image-host.js')
  const petTemplate = read('pages/me/pet.wxml')
  const ignoredValues = (projectConfig.packOptions.ignore || []).map(item => item.value)

  assert.equal(ignoredValues.filter(value => /^images\/pet\//.test(value)).length, 9)
  assert.equal((imageHost.match(/'\/images\/pet\//g) || []).length, 9)
  assert.doesNotMatch(petTemplate, /class="pet-preload"/)
})
