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
  '/images/home/exam-entry-banner-entry.png': true,
  '/images/home/exam-entry-banner-exit-locked.png': true,
  '/images/home/exam-entry-banner-exit.png': true,
  '/images/home/exam-entry-prompt-hero.png': true,
  '/images/home/exam-intro-hero-v2.jpg': true,
  '/images/home/exam-report-header-v2.jpg': true,
  '/images/home/fab-today-locate-jelly.png': true,
  '/images/home/hero-campus-jelly-overlay-sprite.png': true,
  '/images/home/hero-campus-jelly-sprite.png': true,
  '/images/home/hero-campus-jelly-v5-girl.png': true,
  '/images/home/hero-campus-jelly-v5-pk-girl.png': true,
  '/images/home/hero-campus-jelly-v5-pk.png': true,
  '/images/home/hero-campus-jelly-v5-trio.png': true,
  '/images/home/hero-campus-jelly-v5.png': true,
  '/images/home/map/monsters/jelly-defeated.png': true,
  '/images/home/map/monsters/jelly-fighting.png': true,
  '/images/home/map/monsters/jelly-locked.png': true,
  '/images/home/me-profile-header-monster-v2.png': true,
  '/images/home/student-monster-pk-sprite-girl.png': true,
  '/images/home/student-monster-pk-sprite.png': true,
  '/images/home/vip-floating-guide-banner.png': true,
  '/images/home/vip-floating-unlock.png': true,
  '/images/listen/loading-mascot-sprite.png': true,
  '/images/listen/loading-mascot.png': true,
  '/images/listen/seek-thumb-mascot-sprite.png': true,
  '/images/listen/tag-sentence-jelly.png': true,
  '/images/listen/tag-word-jelly.png': true,
  '/images/mini-program-icon-1024.png': true,
  '/images/onboarding/onboard-intro-hero.png': true,
  '/images/onboarding/onboard-panel-01.jpg': true,
  '/images/onboarding/onboard-panel-02.jpg': true,
  '/images/onboarding/onboard-panel-03.jpg': true,
  '/images/onboarding/onboard-step-grade-v2-raw.png': true,
  '/images/onboarding/onboard-step-grade-v2.png': true,
  '/images/onboarding/onboard-step-grade.png': true,
  '/images/onboarding/onboard-step-semester.png': true,
  '/images/onboarding/onboard-step-textbook-v2-raw.png': true,
  '/images/onboarding/onboard-step-textbook-v2.png': true,
  '/images/onboarding/onboard-step-textbook.png': true,
  '/images/plan/jelly-defeated-checker-preview.png': true,
  '/images/plan/jelly-defeated-preview-grey.png': true,
  '/images/plan/jelly-defeated-preview-raw.png': true,
  '/images/plan/plan-mascot-easy.png': true,
  '/images/plan/plan-mascot-hard.png': true,
  '/images/plan/plan-mascot-normal.png': true,
  '/images/vip/membership-family-hero-v2.jpg': true,
  '/images/vip/membership-records-empty.png': true,
  '/images/vip/membership-success.jpg': true
}

const REMOTE_IMAGE_VERSIONS = {
  '/images/home/exam-entry-banner-exit-locked.png': '20260618-art-v2',
  '/images/home/exam-entry-banner-exit.png': '20260618-art-v2',
  '/images/home/exam-intro-hero-v2.jpg': '20260618-art-v2',
  '/images/home/exam-entry-prompt-hero.png': '20260624-entry-prompt-v3',
  '/images/home/hero-campus-jelly-v5-girl.png': '20260623-record-hero-v2',
  '/images/home/hero-campus-jelly-v5-pk-girl.png': '20260612-pk-hero-v1',
  '/images/home/hero-campus-jelly-v5-pk.png': '20260612-pk-hero-v1',
  '/images/home/hero-campus-jelly-v5-trio.png': '20260623-hero-trio-v1',
  '/images/home/hero-campus-jelly-v5.png': '20260623-record-hero-v2',
  '/images/home/vip-floating-guide-banner.png': '20260623-vip-floating-banner-v12',
  '/images/home/vip-floating-unlock.png': '20260623-vip-floating-v4',
  '/images/home/map/monsters/jelly-defeated.png': '20260620-defeated-cloth-flag-v5',
  '/images/home/map/monsters/jelly-fighting.png': '20260619-monster-3x-v1',
  '/images/home/map/monsters/jelly-locked.png': '20260620-locked-color-v2',
  '/images/home/me-profile-header-monster-v2.png': '20260618-art-v2',
  '/images/home/student-monster-pk-sprite-girl.png': '20260624-pk-vs-nudge-v1',
  '/images/home/student-monster-pk-sprite.png': '20260624-pk-vs-nudge-v1',
  '/images/onboarding/onboard-panel-01.jpg': '20260626-panel-v6',
  '/images/onboarding/onboard-panel-02.jpg': '20260626-panel-v6',
  '/images/onboarding/onboard-panel-03.jpg': '20260626-panel-v6',
  '/images/plan/plan-mascot-easy.png': '20260620-plan-mascot-color-v7',
  '/images/plan/plan-mascot-hard.png': '20260620-plan-mascot-color-v7',
  '/images/plan/plan-mascot-normal.png': '20260620-plan-mascot-color-v7',
  '/images/vip/membership-family-hero-v2.jpg': '20260625-family-hero-v3',
  '/images/vip/membership-records-empty.png': '20260625-records-empty-v4',
  '/images/vip/membership-success.jpg': '20260624-vip-crown-v1'
}

// These files exist locally but are currently missing on COS.
// Force local delivery so the affected pages keep rendering.
const FORCE_LOCAL_IMAGE_PATHS = {
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
  if (FORCE_LOCAL_IMAGE_PATHS[normalized]) {
    return normalized
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
