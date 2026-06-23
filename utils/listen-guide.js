// 随身听首次进入引导：向左滑查看课文 → 展开例句跟读评测。
const LISTEN_GUIDE_DONE_KEY = 'listen-first-guide-done'

function hasCompletedListenGuide() {
  return !!wx.getStorageSync(LISTEN_GUIDE_DONE_KEY)
}

function markListenGuideDone() {
  wx.setStorageSync(LISTEN_GUIDE_DONE_KEY, true)
}

function findGuideTrackIndex(tracks) {
  const list = Array.isArray(tracks) ? tracks : []
  if (!list.length) {
    return -1
  }
  const sentenceIndex = list.findIndex(item => item && item.type === 'sentence')
  return sentenceIndex >= 0 ? sentenceIndex : 0
}

module.exports = {
  LISTEN_GUIDE_DONE_KEY,
  hasCompletedListenGuide,
  markListenGuideDone,
  findGuideTrackIndex
}
