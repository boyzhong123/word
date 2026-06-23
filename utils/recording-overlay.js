// rpx -> px：录音浮层定位用的是 boundingClientRect 的 px，偏移量按屏宽换算
function rpxToPx(rpx) {
  try {
    const info = (wx.getWindowInfo && wx.getWindowInfo()) || wx.getSystemInfoSync()
    const w = (info && info.windowWidth) || 375
    return rpx * (w / 750)
  } catch (e) {
    return rpx * 0.5
  }
}

function pickRecordingRect(mediaRect, fallbackRect) {
  if (mediaRect && mediaRect.width > 0) {
    return mediaRect
  }
  if (fallbackRect && fallbackRect.width > 0) {
    return fallbackRect
  }
  return null
}

function buildOverlayPatch(overlay, rect, positionOnly) {
  const wasActive = overlay.active
  if (positionOnly && !wasActive) {
    return null
  }
  const waveSession = positionOnly || wasActive
    ? overlay.waveSession
    : (overlay.waveSession || 0) + 1
  return {
    active: true,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    waveSession
  }
}

function syncRecordingOverlay(page, options) {
  const opts = options || {}
  const positionOnly = !!opts.positionOnly
  const overlayKey = opts.overlayKey || 'recordingOverlay'
  const mediaSelector = opts.mediaSelector || '.media'
  const fallbackSelector = opts.fallbackSelector || ''
  // 录音波纹整体下移：单词录音时录音控件在卡片中上部，波纹显得偏高，统一往下挪一段
  const topOffset = opts.topOffsetRpx ? rpxToPx(opts.topOffsetRpx) : 0
  const canSync = typeof opts.canSync === 'function' ? opts.canSync() : true

  if (!canSync) {
    return
  }

  const q = page.createSelectorQuery()
  q.select(mediaSelector).boundingClientRect()
  if (fallbackSelector) {
    q.select(fallbackSelector).boundingClientRect()
  }
  q.exec(res => {
    const mediaRect = res && res[0]
    const fallbackRect = fallbackSelector ? res && res[1] : null
    const rect = pickRecordingRect(mediaRect, fallbackRect)
    if (!rect) {
      return
    }
    const adjustedRect = topOffset
      ? Object.assign({}, rect, { top: rect.top + topOffset })
      : rect
    const overlay = page.data[overlayKey] || {}
    const patch = buildOverlayPatch(overlay, adjustedRect, positionOnly)
    if (!patch) {
      return
    }
    page.setData({
      [overlayKey]: patch
    })
  })
}

function hideRecordingOverlay(page, options) {
  const overlayKey = (options && options.overlayKey) || 'recordingOverlay'
  const overlay = page.data[overlayKey] || {}
  if (!overlay.active) {
    return
  }
  page.setData({
    [overlayKey]: {
      active: false,
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      waveSession: overlay.waveSession
    }
  })
}

module.exports = {
  pickRecordingRect,
  syncRecordingOverlay,
  hideRecordingOverlay
}
