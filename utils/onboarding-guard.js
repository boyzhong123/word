// 未完成学生档案时，统一跳转独立引导页（全局首访拦截）。
const { hasStudentProfile } = require('./student-profile')

const ONBOARDING_ROUTE = 'pages/onboarding/onboarding'

function redirectToOnboardingIfNeeded() {
  if (hasStudentProfile()) {
    return false
  }
  const pages = getCurrentPages()
  const top = pages[pages.length - 1]
  if (top && top.route === ONBOARDING_ROUTE) {
    return true
  }
  wx.reLaunch({ url: '/pages/onboarding/onboarding' })
  return true
}

module.exports = {
  ONBOARDING_ROUTE,
  redirectToOnboardingIfNeeded
}
