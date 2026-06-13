const REMOTE_IMAGE_HOST = 'https://project-24r2y.vercel.app'
const USE_REMOTE_IMAGES = true

const REMOTE_IMAGE_PATHS = {
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
  '/images/home/ad/product-hero-clean.png': true,
  '/images/home/fab-today-locate-jelly.png': true,
  '/images/home/hero-campus-jelly-v5.png': true,
  '/images/home/map/monsters/jelly-fighting.png': true,
  '/images/home/me-profile-header-monster-v2.png': true,
  '/images/home/student-monster-pk-sprite.png': true,
  '/images/listen/loading-mascot.png': true,
  '/images/listen/seek-thumb-mascot-sprite.png': true,
  '/images/listen/tag-sentence-jelly.png': true,
  '/images/listen/tag-word-jelly.png': true,
  '/images/mini-program-icon-1024.png': true
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
  return REMOTE_IMAGE_PATHS[normalized] ? REMOTE_IMAGE_HOST + normalized : normalized
}

module.exports = {
  IMAGE_BASE_URL: shouldUseRemoteImages() ? REMOTE_IMAGE_HOST : '',
  REMOTE_IMAGE_HOST,
  imageUrl
}
