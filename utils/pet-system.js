const FEATURE_KEY = 'petFeatureEnabled'
const WALLET_KEY = 'petWallet'
const LEDGER_KEY = 'petCoinLedger'
const PET_KEY = 'petState'
const AWARD_KEY = 'petStudyAwards'
const { imageUrl } = require('./image-host')

const RESTORE_COST = 60
const MAX_LEDGER = 80

const PET_CATALOG = [
  {
    stage: 'primary',
    label: '小学组',
    desc: '更可爱、更活泼，适合刚开始建立学习陪伴感。',
    pets: [
      {
        id: 'primary-reader-cat',
        name: '橘橘',
        type: '猫',
        image: imageUrl('/images/pet/primary-reader-cat.png'),
        sceneClass: 'pet-stage-primary'
      },
      {
        id: 'primary-scarf-dog',
        name: '豆豆',
        type: '狗',
        image: imageUrl('/images/pet/primary-scarf-dog.png'),
        sceneClass: 'pet-stage-primary'
      },
      {
        id: 'primary-star-bunny',
        name: '星星',
        type: '兔',
        image: imageUrl('/images/pet/primary-star-bunny.png'),
        sceneClass: 'pet-stage-primary'
      }
    ]
  },
  {
    stage: 'middle',
    label: '初中组',
    desc: '更像探索搭子，适合词汇、听力和闯关节奏。',
    pets: [
      {
        id: 'middle-note-fox',
        name: '阿探',
        type: '狐',
        image: imageUrl('/images/pet/middle-note-fox.png'),
        sceneClass: 'pet-stage-middle'
      },
      {
        id: 'middle-coder-dog',
        name: '蓝豆',
        type: '狗',
        image: imageUrl('/images/pet/middle-explorer-dog.png'),
        sceneClass: 'pet-stage-middle'
      },
      {
        id: 'middle-audio-cat',
        name: '耳朵',
        type: '猫',
        image: imageUrl('/images/pet/middle-audio-cat.png'),
        sceneClass: 'pet-stage-middle'
      }
    ]
  },
  {
    stage: 'high',
    label: '高中组',
    desc: '更沉稳、更目标导向，适合长期计划和复习。',
    pets: [
      {
        id: 'high-mentor-owl',
        name: '墨墨',
        type: '鸮',
        image: imageUrl('/images/pet/high-mentor-owl.png'),
        sceneClass: 'pet-stage-high'
      },
      {
        id: 'high-focus-cat',
        name: '准准',
        type: '猫',
        image: imageUrl('/images/pet/high-focus-cat.png'),
        sceneClass: 'pet-stage-high'
      },
      {
        id: 'high-planner-dog',
        name: '远航',
        type: '狗',
        image: imageUrl('/images/pet/high-planner-dog.png'),
        sceneClass: 'pet-stage-high'
      }
    ]
  }
]

function storageGet(key, fallback) {
  try {
    const value = wx.getStorageSync(key)
    return value === undefined || value === '' ? fallback : value
  } catch (error) {
    return fallback
  }
}

function storageSet(key, value) {
  try {
    wx.setStorageSync(key, value)
  } catch (error) {}
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function todayKey(date) {
  const target = date ? new Date(date) : new Date()
  return [
    target.getFullYear(),
    pad(target.getMonth() + 1),
    pad(target.getDate())
  ].join('-')
}

function nowText(date) {
  const target = date ? new Date(date) : new Date()
  return `${todayKey(target)} ${pad(target.getHours())}:${pad(target.getMinutes())}`
}

function getPetCatalog() {
  return PET_CATALOG.map(group => Object.assign({}, group, {
    pets: group.pets.map(pet => Object.assign({}, pet))
  }))
}

function findPet(stage, variantId) {
  const group = PET_CATALOG.find(item => item.stage === stage) || PET_CATALOG[0]
  return (group.pets.find(pet => pet.id === variantId) || group.pets[0])
}

function getPetFeatureEnabled() {
  const value = storageGet(FEATURE_KEY, true)
  return value !== false
}

function setPetFeatureEnabled(enabled) {
  storageSet(FEATURE_KEY, Boolean(enabled))
  return getPetFeatureEnabled()
}

function getWallet() {
  const wallet = storageGet(WALLET_KEY, null)
  if (wallet && Number.isFinite(Number(wallet.coins))) {
    return { coins: Math.max(0, Math.floor(Number(wallet.coins))) }
  }
  return { coins: 0 }
}

function saveWallet(wallet) {
  const next = { coins: Math.max(0, Math.floor(Number(wallet.coins) || 0)) }
  storageSet(WALLET_KEY, next)
  return next
}

function getCoinLedger() {
  const ledger = storageGet(LEDGER_KEY, [])
  return Array.isArray(ledger) ? ledger : []
}

function addLedger(amount, title, detail, date) {
  const item = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    amount,
    title,
    detail: detail || '',
    time: nowText(date)
  }
  const ledger = getCoinLedger().concat(item).slice(-MAX_LEDGER)
  storageSet(LEDGER_KEY, ledger)
  return item
}

function addCoins(amount, title, detail, date) {
  const value = Math.floor(Number(amount) || 0)
  if (!value) {
    return getWallet()
  }
  const wallet = getWallet()
  wallet.coins += value
  const saved = saveWallet(wallet)
  addLedger(value, title || '金币奖励', detail, date)
  return saved
}

function spendCoins(amount, title, detail, date) {
  const value = Math.floor(Number(amount) || 0)
  if (value < 0) {
    return addCoins(Math.abs(value), title || '金币补充', detail, date)
  }
  const wallet = getWallet()
  if (wallet.coins < value) {
    return { ok: false, coins: wallet.coins }
  }
  wallet.coins -= value
  const saved = saveWallet(wallet)
  addLedger(-value, title || '金币消耗', detail, date)
  return Object.assign({ ok: true }, saved)
}

function defaultPetState() {
  return {
    adopted: false,
    stage: '',
    variantId: '',
    name: '',
    type: '',
    image: '',
    sceneClass: '',
    status: 'none',
    level: 1,
    bond: 0,
    hunger: 72,
    energy: 70,
    clean: 74,
    mood: 76,
    lastCareDate: todayKey()
  }
}

function getPetState() {
  const stored = storageGet(PET_KEY, null)
  const state = stored && typeof stored === 'object'
    ? Object.assign(defaultPetState(), stored)
    : defaultPetState()
  if (state.adopted && state.stage && state.variantId) {
    const pet = findPet(state.stage, state.variantId)
    state.image = pet.image
    state.sceneClass = pet.sceneClass
    state.type = pet.type
  }
  return state
}

function savePetState(state) {
  storageSet(PET_KEY, state)
  return state
}

function adoptPet(stage, variantId) {
  const pet = findPet(stage, variantId)
  const state = Object.assign(defaultPetState(), {
    adopted: true,
    stage,
    variantId: pet.id,
    name: pet.name,
    type: pet.type,
    image: pet.image,
    sceneClass: pet.sceneClass,
    status: 'home',
    level: 1,
    bond: 12,
    hunger: 78,
    energy: 76,
    clean: 80,
    mood: 82
  })
  return savePetState(state)
}

function updatePetStats(changes) {
  const state = getPetState()
  Object.keys(changes || {}).forEach(key => {
    if (['hunger', 'energy', 'clean', 'mood', 'bond'].indexOf(key) !== -1) {
      state[key] = Math.max(0, Math.min(100, Math.floor((Number(state[key]) || 0) + Number(changes[key]))))
    }
  })
  state.status = state.mood < 18 && state.hunger < 18 ? 'away' : 'home'
  return savePetState(state)
}

function restorePetWithCoins() {
  const result = spendCoins(RESTORE_COST, '找回宠物', '小伙伴回家啦')
  if (!result.ok) {
    return result
  }
  const state = getPetState()
  state.status = 'home'
  state.hunger = Math.max(state.hunger, 52)
  state.energy = Math.max(state.energy, 48)
  state.clean = Math.max(state.clean, 50)
  state.mood = Math.max(state.mood, 58)
  savePetState(state)
  return Object.assign({ ok: true }, result)
}

function readAwards() {
  const awards = storageGet(AWARD_KEY, {})
  return awards && typeof awards === 'object' ? awards : {}
}

function taskReward(taskType) {
  if (taskType === 'listening') {
    return { amount: 10, title: '完成随身听' }
  }
  if (taskType === 'word') {
    return { amount: 12, title: '完成新词学习' }
  }
  return { amount: 14, title: '完成今日学习' }
}

function awardStudyCoins(options) {
  options = options || {}
  const date = options.date || todayKey()
  const taskType = options.taskType || 'recitation'
  const unitId = options.unitId || 'default'
  const key = [date, taskType, unitId].join('|')
  const awards = readAwards()
  if (awards[key]) {
    return { awarded: 0, wallet: getWallet(), duplicate: true }
  }

  const reward = taskReward(taskType)
  const bonus = options.dailyGoalCompleted ? 20 : 0
  const amount = reward.amount + bonus
  const detail = bonus ? '含每日目标达成 +20' : '学习完成奖励'
  awards[key] = true
  storageSet(AWARD_KEY, awards)
  const wallet = addCoins(amount, reward.title, detail, date)
  updatePetStats({ hunger: -3, energy: -2, mood: 5, bond: 2 })
  return { awarded: amount, wallet, duplicate: false }
}

module.exports = {
  RESTORE_COST,
  addCoins,
  adoptPet,
  awardStudyCoins,
  getCoinLedger,
  getPetCatalog,
  getPetFeatureEnabled,
  getPetState,
  getWallet,
  restorePetWithCoins,
  setPetFeatureEnabled,
  spendCoins,
  updatePetStats
}
