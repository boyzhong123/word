let activeMedia = null
let scoringMedia = null
let fallbackMedia = null

function routeMediaTarget() {
  return scoringMedia || activeMedia || fallbackMedia
}

function setActiveMedia(media) {
  activeMedia = media || null
}

function beginScoring(media) {
  if (!media) {
    return
  }
  scoringMedia = media
  activeMedia = media
  media._scoringActive = true
}

function isScoringMedia(media) {
  return !!(media && (scoringMedia === media || media._scoringActive))
}

function shouldProtectFromCancel(media) {
  if (!media) {
    return false
  }
  return isScoringMedia(media) || media.data.media_state === 4
}

function clearMediaPointers(media) {
  if (!media) {
    return
  }
  if (activeMedia === media) {
    activeMedia = null
  }
  if (scoringMedia === media) {
    scoringMedia = null
  }
  media._scoringActive = false
}

function setFallbackMedia(media) {
  fallbackMedia = media || null
}

function abortOtherScoring(media) {
  if (scoringMedia && scoringMedia !== media) {
    scoringMedia.resetMarkingState()
  }
}

module.exports = {
  routeMediaTarget,
  setActiveMedia,
  beginScoring,
  isScoringMedia,
  shouldProtectFromCancel,
  clearMediaPointers,
  setFallbackMedia,
  abortOtherScoring
}
