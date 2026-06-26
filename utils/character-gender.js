const GENDER_BOY = 'boy'
const GENDER_GIRL = 'girl'
// 学习形象性别是后端业务真值（onboarding 采集 → user/info），前端不持久化：
// 收口到 mock-store 的 characterGender slice。
const mockStore = require('./mock/mock-store')
const { getStudentProfile } = require('./student-profile')
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
  return normalizeGender(mockStore.getSlice('characterGender'))
}

function setCharacterGender(gender) {
  const normalized = normalizeGender(gender)
  // 接后端：随 onboarding 一并 POST user/info-update
  mockStore.setSlice('characterGender', normalized)
  return normalized
}

// 形象图组优先用后端下发（mock-store.characterAssets），缺失回退 bundled 默认。
// 前端不再「按规则拼图片路径」，只渲染数据给的 URL；运营换形象由后端下发、不发版。
function getCharacterAssets(gender) {
  const key = normalizeGender(gender || getCharacterGender())
  const overrides = mockStore.getSlice('characterAssets')
  const override = overrides && overrides[key]
  return Object.assign({}, CHARACTER_ASSETS[key], override)
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
  if (value !== undefined && value !== null && value !== '') {
    return normalizeGender(value)
  }
  const profile = getStudentProfile()
  if (profile && profile.childGender) {
    return normalizeGender(profile.childGender)
  }
  return ''
}

module.exports = {
  GENDER_BOY,
  GENDER_GIRL,
  PK_SPRITE_DURATION,
  normalizeGender,
  getCharacterGender,
  setCharacterGender,
  getCharacterAssets,
  buildCharacterImageUrls,
  pickGenderFromUserInfo
}
