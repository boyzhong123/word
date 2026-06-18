const REMOTE_IMAGE_HOST = 'https://proverbs-assets-1259216952.cos.ap-nanjing.myqcloud.com'
const USE_REMOTE_IMAGES = true

const REMOTE_IMAGE_PATHS = {
  '/images/audio.png': true,
  '/images/checkin/share-bg-streak-monster-light.png': true,
  '/images/checkin/share-bg-streak-monster.png': true,
  '/images/checkin/share-bg-streak-pk-light.png': true,
  '/images/checkin/share-bg-streak-pk.png': true,
  '/images/checkin/share-bg-streak-words-light.png': true,
  '/images/checkin/share-bg-streak-words.png': true,
  '/images/checkin/share-bg-today-monster-light.png': true,
  '/images/checkin/share-bg-today-monster.png': true,
  '/images/checkin/share-bg-today-pk-light.png': true,
  '/images/checkin/share-bg-today-pk.png': true,
  '/images/checkin/share-bg-today-words-light.png': true,
  '/images/checkin/share-bg-today-words.png': true,
  '/images/finish/finish-today-header-1star.png': true,
  '/images/finish/finish-today-header-2star.png': true,
  '/images/finish/finish-today-header-3star.png': true,
  '/images/home/ad/icon-press-jelly.png': true,
  '/images/home/ad/icon-proverb-jelly.png': true,
  '/images/home/ad/icon-review-jelly.png': true,
  '/images/home/ad/icon-word-jelly.png': true,
  '/images/home/ad/product-hero-clean.png': true,
  '/images/home/ad/product-hero-purchase-v3.jpg': true,
  '/images/home/ad/product-hero-purchase-v2.jpg': true,
  '/images/home/ad/product-hero-purchase.jpg': true,
  '/images/home/exam-entry-banner-entry.png': true,
  '/images/home/exam-entry-banner-exit-locked.png': true,
  '/images/home/exam-entry-banner-exit.png': true,
  '/images/home/exam-intro-hero-v2.jpg': true,
  '/images/home/exam-report-header-v2.jpg': true,
  '/images/home/fab-today-locate-jelly.png': true,
  '/images/home/hero-campus-jelly-overlay-sprite.png': true,
  '/images/home/hero-campus-jelly-sprite.png': true,
  '/images/home/hero-campus-jelly-v5-girl.png': true,
  '/images/home/hero-campus-jelly-v5.png': true,
  '/images/home/map/monsters/jelly-defeated.png': true,
  '/images/home/map/monsters/jelly-fighting.png': true,
  '/images/home/map/monsters/jelly-locked.png': true,
  '/images/home/me-profile-header-monster-v2.png': true,
  '/images/home/student-monster-pk-sprite-girl.png': true,
  '/images/home/student-monster-pk-sprite.png': true,
  '/images/listen/loading-mascot-sprite.png': true,
  '/images/listen/loading-mascot.png': true,
  '/images/listen/seek-thumb-mascot-sprite.png': true,
  '/images/listen/tag-sentence-jelly.png': true,
  '/images/listen/tag-word-jelly.png': true,
  '/images/mini-program-icon-1024.png': true,
  '/images/pet/high-focus-cat.png': true,
  '/images/pet/high-mentor-owl.png': true,
  '/images/pet/high-planner-dog.png': true,
  '/images/pet/middle-audio-cat.png': true,
  '/images/pet/middle-explorer-dog.png': true,
  '/images/pet/middle-note-fox.png': true,
  '/images/pet/primary-reader-cat.png': true,
  '/images/pet/primary-scarf-dog.png': true,
  '/images/pet/primary-star-bunny.png': true
}

const REMOTE_IMAGE_VERSIONS = {
  '/images/home/exam-entry-banner-exit-locked.png': '20260618-art-v2',
  '/images/home/exam-entry-banner-exit.png': '20260618-art-v2',
  '/images/home/exam-intro-hero-v2.jpg': '20260618-art-v2',
  '/images/home/hero-campus-jelly-v5-girl.png': '20260618-art-v2',
  '/images/home/map/monsters/jelly-defeated.png': '20260618-art-v2',
  '/images/home/map/monsters/jelly-locked.png': '20260618-locked-fighting-palette-v7',
  '/images/home/me-profile-header-monster-v2.png': '20260618-art-v2',
  '/images/home/student-monster-pk-sprite-girl.png': '20260618-art-v2'
}

function normalizeImagePath(path) {
  const value = String(path || '')
  if (/^https?:\/\//.test(value)) {
    return value
  }
  return value
    .replace(/^(\.\.\/)+/, '/')
    .replace(/^\.\//, '/')
    .replace(/^images\//, '/images/')
}

function shouldUseRemoteImages() {
  return USE_REMOTE_IMAGES && typeof wx !== 'undefined'
}

function imageUrl(path) {
  const normalized = normalizeImagePath(path)
  if (!shouldUseRemoteImages() || /^https?:\/\//.test(normalized)) {
    return path
  }
  if (!REMOTE_IMAGE_PATHS[normalized]) {
    return normalized
  }
  const version = REMOTE_IMAGE_VERSIONS[normalized]
  return REMOTE_IMAGE_HOST + normalized + (version ? '?v=' + version : '')
}

module.exports = {
  IMAGE_BASE_URL: shouldUseRemoteImages() ? REMOTE_IMAGE_HOST : '',
  REMOTE_IMAGE_HOST,
  imageUrl
}
