function getAppSafe() {
  try {
    return getApp()
  } catch (error) {
    return null
  }
}

function resetVipFloatingGuideDismissed() {
  const app = getAppSafe()
  if (app && app.globalData) {
    app.globalData.vipFloatingGuideDismissed = false
  }
}

function isVipFloatingGuideDismissed() {
  const app = getAppSafe()
  return !!(app && app.globalData && app.globalData.vipFloatingGuideDismissed)
}

function dismissVipFloatingGuide() {
  const app = getAppSafe()
  if (app && app.globalData) {
    app.globalData.vipFloatingGuideDismissed = true
  }
}

// 内容已全局免费解锁：不再对非会员自动弹出「开通 VIP」诱导浮层。
// 如需恢复非会员的 VIP 引导，将 ENABLE_VIP_FLOATING_GUIDE 置回 true 即可。
const ENABLE_VIP_FLOATING_GUIDE = false

function shouldShowVipFloatingGuide(membership) {
  if (!ENABLE_VIP_FLOATING_GUIDE) {
    return false
  }
  return !(membership && membership.active) && !isVipFloatingGuideDismissed()
}

module.exports = {
  resetVipFloatingGuideDismissed,
  isVipFloatingGuideDismissed,
  dismissVipFloatingGuide,
  shouldShowVipFloatingGuide
}
