const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const genderScript = fs.readFileSync(path.join(projectRoot, 'utils/character-gender.js'), 'utf8')
const meScript = fs.readFileSync(path.join(projectRoot, 'pages/me/me.js'), 'utf8')
const meTemplate = fs.readFileSync(path.join(projectRoot, 'pages/me/me.wxml'), 'utf8')
const homeScript = fs.readFileSync(path.join(projectRoot, 'pages/home/home.js'), 'utf8')
const homeTemplate = fs.readFileSync(path.join(projectRoot, 'pages/home/home.wxml'), 'utf8')
const imageHostScript = fs.readFileSync(path.join(projectRoot, 'utils/image-host.js'), 'utf8')

const {
  GENDER_BOY,
  GENDER_GIRL,
  normalizeGender,
  getCharacterAssets,
  buildCharacterImageUrls
} = require('../utils/character-gender')

test('character gender utility normalizes values and maps assets', () => {
  assert.equal(normalizeGender('girl'), GENDER_GIRL)
  assert.equal(normalizeGender(2), GENDER_GIRL)
  assert.equal(normalizeGender('boy'), GENDER_BOY)
  assert.equal(normalizeGender(undefined), GENDER_BOY)

  assert.equal(
    getCharacterAssets(GENDER_GIRL).hero,
    '/images/home/hero-campus-jelly-v5-trio.png'
  )
  assert.equal(
    getCharacterAssets(GENDER_BOY).hero,
    '/images/home/hero-campus-jelly-v5-trio.png'
  )
  assert.equal(
    getCharacterAssets(GENDER_GIRL).todayHero,
    '/images/home/hero-campus-jelly-v5-pk-girl.png'
  )
  assert.equal(
    getCharacterAssets(GENDER_GIRL).pkSprite,
    '/images/home/student-monster-pk-sprite-girl.png'
  )
  assert.deepEqual(buildCharacterImageUrls('https://cdn.test'), {
    characterGender: GENDER_BOY,
    heroImageUrl: '/images/home/hero-campus-jelly-v5-trio.png',
    todayHeroImageUrl: '/images/home/hero-campus-jelly-v5-pk.png',
    pkSpriteUrl: '/images/home/student-monster-pk-sprite.png',
    pkSpriteDuration: 3
  })
})

test('girl hero and pk assets exist for gender switching', () => {
  assert.equal(
    fs.existsSync(path.join(projectRoot, 'images/home/hero-campus-jelly-v5-trio.png')),
    true
  )
  assert.equal(
    fs.existsSync(path.join(projectRoot, 'images/home/student-monster-pk-sprite-girl.png')),
    true
  )
})

test('me page exposes a boy/girl learning avatar toggle', () => {
  assert.match(genderScript, /characterGender/)
  assert.match(meScript, /label: '学习形象'/)
  assert.match(meScript, /handleGenderSelect/)
  assert.match(meScript, /saveUserInfo\(\{ characterGender: nextGender \}\)/)
  assert.match(meTemplate, /class="gender-switch"/)
  assert.match(meTemplate, /data-gender="boy"/)
  assert.match(meTemplate, /data-gender="girl"/)
})

test('home page uses gender-aware hero and pk sprite urls', () => {
  assert.match(homeScript, /buildCharacterImageUrls/)
  assert.match(homeScript, /applyCharacterAssets/)
  assert.match(homeTemplate, /src="{{heroImageUrl}}"/)
  assert.match(homeTemplate, /url="{{pkSpriteUrl}}"/)
  assert.match(imageHostScript, /hero-campus-jelly-v5-trio\.png/)
  assert.match(imageHostScript, /hero-campus-jelly-v5-pk\.png/)
  assert.match(imageHostScript, /student-monster-pk-sprite-girl\.png/)
})

test('today page keeps the previous pk hero while growth uses the new hero', () => {
  const todayTemplate = fs.readFileSync(path.join(projectRoot, 'pages/today/today.wxml'), 'utf8')
  const todayScript = fs.readFileSync(path.join(projectRoot, 'pages/today/today.js'), 'utf8')
  assert.match(todayTemplate, /src="{{todayHeroImageUrl}}"/)
  assert.doesNotMatch(todayTemplate, /src="{{heroImageUrl}}"/)
  assert.match(todayScript, /applyCharacterAssets/)
  assert.match(todayScript, /onShow\(\)[\s\S]*applyCharacterAssets/)
})

test('growth hero slogan avoids webkit text stroke for real-device readability', () => {
  const homeStyles = fs.readFileSync(path.join(projectRoot, 'pages/home/home.wxss'), 'utf8')
  assert.doesNotMatch(homeStyles, /hero-slogan-line[\s\S]*-webkit-text-stroke/)
  assert.match(homeStyles, /hero-slogan-line[\s\S]*text-shadow/)
})
