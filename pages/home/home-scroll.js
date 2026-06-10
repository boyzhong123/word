function computeScrollTopToAlignTarget(scrollTop, targetRect, scrollRect, offset = 0) {
  if (!targetRect || !scrollRect) {
    return null
  }
  return Math.max(0, scrollTop + targetRect.top - scrollRect.top - offset)
}

function computeScrollTopToCenterTarget(scrollTop, targetRect, scrollRect) {
  if (!targetRect || !scrollRect) {
    return null
  }
  const centerOffset = (scrollRect.height - (targetRect.height || 0)) / 2
  return computeScrollTopToAlignTarget(scrollTop, targetRect, scrollRect, centerOffset)
}

module.exports = {
  computeScrollTopToAlignTarget,
  computeScrollTopToCenterTarget
}
