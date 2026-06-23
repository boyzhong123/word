const GENDER_BOY = 'boy'
const GENDER_GIRL = 'girl'
const STORAGE_KEY = 'characterGender'
const PK_SPRITE_DURATION = 3
const { imageUrl } = require('./image-host')

// 首页 hero：男生、女生、小怪兽三人同框，不随形象切换
const HOME_HERO = '/images/home/hero-campus-jelly-v5-trio.png'

const CHARACTER_ASSETS = {
  [GENDER_BOY]: {
    hero: HOME_HERO,
    todayHero: '/images/home/hero-campus-jelly-v5-pk.png',
    pkSprite: '/images/home/student-monster-pk-sprite.png'
  },
  [GENDER_GIRL]: {
    hero: HOME_HERO,
    todayHero: '/images/home/hero-campus-jelly-v5-pk-girl.png',
    pkSprite: '/images/home/student-monster-pk-sprite-girl.png'
  }
}

function normalizeGender(value) {
  if (
    value === GENDER_GIRL
    || value === 'girl'
    || value === 'female'
    || value === '女'
    || value === '女生'
    || value === 2
    || value === '2'
  ) {
    return GENDER_GIRL
  }
  return GENDER_BOY
}

function getCharacterGender() {
  if (typeof wx === 'undefined') {
    return GENDER_BOY
  }
  return normalizeGender(wx.getStorageSync(STORAGE_KEY))
}

function setCharacterGender(gender) {
  const normalized = normalizeGender(gender)
  if (typeof wx !== 'undefined') {
    wx.setStorageSync(STORAGE_KEY, normalized)
  }
  return normalized
}

function getCharacterAssets(gender) {
  return CHARACTER_ASSETS[normalizeGender(gender || getCharacterGender())]
}

function buildCharacterImageUrls(imageBaseUrl) {
  const assets = getCharacterAssets()
  return {
    characterGender: getCharacterGender(),
    heroImageUrl: imageUrl(assets.hero),
    todayHeroImageUrl: imageUrl(assets.todayHero),
    pkSpriteUrl: imageUrl(assets.pkSprite),
    pkSpriteDuration: PK_SPRITE_DURATION
  }
}

function pickGenderFromUserInfo(userInfo) {
  userInfo = userInfo || {}
  const value = userInfo.characterGender
    || userInfo.gender
    || userInfo.studentGender
    || userInfo.childGender
  if (value === undefined || value === null || value === '') {
    return ''
  }
  return normalizeGender(value)
}

module.exports = {
  GENDER_BOY,
  GENDER_GIRL,
  STORAGE_KEY,
  PK_SPRITE_DURATION,
  normalizeGender,
  getCharacterGender,
  setCharacterGender,
  getCharacterAssets,
  buildCharacterImageUrls,
  pickGenderFromUserInfo
}
