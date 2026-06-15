const {
  RESTORE_COST,
  adoptPet,
  getCoinLedger,
  getPetCatalog,
  getPetFeatureEnabled,
  getPetState,
  getWallet,
  restorePetWithCoins,
  setPetFeatureEnabled,
  spendCoins,
  updatePetStats
} = require('../../utils/pet-system')

function getSafeArea() {
  const systemInfo = wx.getSystemInfoSync()
  const safeArea = systemInfo.safeArea || {}
  const safeAreaTop = safeArea.top || systemInfo.statusBarHeight || 0
  const safeAreaBottom = safeArea.bottom
    ? Math.max(systemInfo.windowHeight - safeArea.bottom, 0)
    : 0
  return { safeAreaTop, safeAreaBottom }
}

function statItems(pet) {
  return [
    { key: 'hunger', label: '饱食', value: pet.hunger },
    { key: 'energy', label: '精力', value: pet.energy },
    { key: 'clean', label: '清洁', value: pet.clean },
    { key: 'mood', label: '心情', value: pet.mood }
  ].map(item => Object.assign({}, item, {
    width: Math.max(0, Math.min(100, Number(item.value) || 0)) + '%',
    tone: item.value < 25 ? 'danger' : (item.value < 50 ? 'warn' : 'good')
  }))
}

function sceneForPet(pet) {
  if (!pet.adopted) {
    return 'idle'
  }
  if (pet.status === 'away') {
    return 'away'
  }
  if (pet.energy < 28) {
    return 'sleep'
  }
  if (pet.hunger < 28) {
    return 'hungry'
  }
  return 'home'
}

Page({
  data: {
    safeAreaTop: 0,
    safeAreaBottom: 0,
    featureEnabled: true,
    petGroups: [],
    wallet: { coins: 0 },
    pet: {},
    stats: [],
    ledger: [],
    scene: 'home',
    restoreCost: RESTORE_COST
  },

  onLoad() {
    this.setData(Object.assign(getSafeArea(), {
      petGroups: getPetCatalog()
    }))
    this.refresh()
  },

  onShow() {
    this.refresh()
  },

  refresh(scene) {
    const pet = getPetState()
    const nextScene = scene || sceneForPet(pet)
    this.setData({
      featureEnabled: getPetFeatureEnabled(),
      wallet: getWallet(),
      pet,
      stats: statItems(pet),
      ledger: getCoinLedger(),
      scene: nextScene
    })
  },

  goBack() {
    wx.navigateBack({
      fail() {
        wx.switchTab({ url: '/pages/me/me' })
      }
    })
  },

  toggleFeature(event) {
    const enabled = Boolean(event.detail.value)
    setPetFeatureEnabled(enabled)
    this.setData({ featureEnabled: enabled })
    wx.showToast({
      title: enabled ? '已开启宠物入口' : '已关闭宠物入口',
      icon: 'none'
    })
  },

  adopt(event) {
    const stage = event.currentTarget.dataset.stage
    const id = event.currentTarget.dataset.id
    adoptPet(stage, id)
    this.refresh('home')
    wx.showToast({ title: '认领成功', icon: 'success' })
  },

  feed() {
    const result = spendCoins(12, '喂食', '恢复饱食和心情')
    if (!result.ok) {
      this.showNeedCoins()
      return
    }
    updatePetStats({ hunger: 34, mood: 8, bond: 2 })
    this.refresh('home')
  },

  sleep() {
    updatePetStats({ energy: 42, hunger: -5 })
    this.refresh('sleep')
  },

  clean() {
    const result = spendCoins(8, '清洁', '小窝清爽一点')
    if (!result.ok) {
      this.showNeedCoins()
      return
    }
    updatePetStats({ clean: 38, mood: 5, bond: 1 })
    this.refresh('home')
  },

  play() {
    const result = spendCoins(10, '玩耍', '提高心情和亲密')
    if (!result.ok) {
      this.showNeedCoins()
      return
    }
    updatePetStats({ mood: 26, energy: -12, bond: 4 })
    this.refresh('home')
  },

  restorePet() {
    const result = restorePetWithCoins()
    if (!result.ok) {
      this.showNeedCoins()
      return
    }
    this.refresh('home')
  },

  restoreByStudy() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  showNeedCoins() {
    wx.showToast({
      title: '金币不足，先完成一次学习',
      icon: 'none'
    })
  }
})
