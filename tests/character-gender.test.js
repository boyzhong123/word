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
    '/images/home/hero-campus-jelly-v5-girl.png'
  )
  assert.equal(
    getCharacterAssets(GENDER_GIRL).pkSprite,
    '/images/home/student-monster-pk-sprite-girl.png'
  )
  assert.deepEqual(buildCharacterImageUrls('https://cdn.test'), {
    characterGender: GENDER_BOY,
    heroImageUrl: 'https://cdn.test/images/home/hero-campus-jelly-v5.png',
    pkSpriteUrl: 'https://cdn.test/images/home/student-monster-pk-sprite.png',
    pkSpriteDuration: 3
  })
})

test('girl hero and pk assets exist for gender switching', () => {
  assert.equal(
    fs.existsSync(path.join(projectRoot, 'images/home/hero-campus-jelly-v5-girl.png')),
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
  assert.match(imageHostScript, /hero-campus-jelly-v5-girl\.png/)
  assert.match(imageHostScript, /student-monster-pk-sprite-girl\.png/)
})
