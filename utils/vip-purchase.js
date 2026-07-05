// 统一跳转会员购买页，保证首页、今日、我的和学习门禁使用同一套购买流程。
// 提审时打开此开关，所有 VIP / 会员入口都会进入「产品介绍」展示页。
const ENABLE_SERVICE_RIGHTS_REVIEW_MODE = false

function getCurrentBook() {
  const app = getApp()
  return (app && app.globalData && app.globalData.book) || {}
}

function isServiceRightsReviewMode(options = {}) {
  if (options.audit === false || options.audit === '0') {
    return false
  }
  return ENABLE_SERVICE_RIGHTS_REVIEW_MODE || options.audit === true || options.audit === '1'
}

function buildVipPurchaseQuery(book, options = {}) {
  const source = book && (book.resBookId || book.name || book.bookName) ? book : getCurrentBook()
  const learningUnits = source.learningInfo && source.learningInfo.book
    ? source.learningInfo.book.learningUnits
    : 0
  const locked = options.locked != null
    ? options.locked
    : (source.locked != null ? !!source.locked : !source.unlocked)
  const parts = [
    'resBookId=' + encodeURIComponent(source.resBookId || ''),
    'name=' + encodeURIComponent(source.name || source.bookName || ''),
    'bookCover=' + encodeURIComponent(source.bookCover || source.cover || ''),
    'total=' + encodeURIComponent(source.total || learningUnits || 0),
    'wordCount=' + encodeURIComponent(source.wordCount || 0),
    'proverbCount=' + encodeURIComponent(source.proverbCount || 0),
    'press=' + encodeURIComponent(source.press || source.publisher || source.version || ''),
    'grades=' + encodeURIComponent(
      source.grades || source.grade || source.gradeTags || source.applyGrades || source.applicableGrades || ''
    ),
    'intro=' + encodeURIComponent(source.intro || ''),
    'unlocked=' + (locked ? '0' : '1')
  ]
  if (options.openSku) {
    parts.push('openSku=1')
  }
  if (isServiceRightsReviewMode(options)) {
    parts.push('audit=1')
  }
  return parts.join('&')
}

function navigateToVipPurchase(book, options = {}) {
  const query = buildVipPurchaseQuery(book, options)
  const navigateOptions = {
    url: '/pages/membership/membership?' + query
  }
  if (options.events) {
    navigateOptions.events = options.events
  } else if (typeof options.onVip === 'function') {
    navigateOptions.events = { vip: options.onVip }
  }
  if (typeof options.success === 'function') {
    navigateOptions.success = options.success
  }
  wx.navigateTo(navigateOptions)
}

// 非会员点击被锁内容（关卡 / 伴读 / 图书）时：先弹确认框提示「未开通会员」，
// 用户点「去开通」再跳会员购买页；点取消则不打扰。options 透传给 navigateToVipPurchase。
function promptVipPurchase(book, options = {}) {
  const reviewMode = isServiceRightsReviewMode(options)
  wx.showModal({
    title: options.title || (reviewMode ? '产品介绍' : '会员专享内容'),
    content: options.content || (reviewMode
      ? '查看当前产品提供的学习服务与功能说明。'
      : '你还不是会员，开通会员后可解锁全部关卡与伴读内容。'),
    confirmText: options.confirmText || (reviewMode ? '查看' : '去开通'),
    cancelText: options.cancelText || '再想想',
    success(res) {
      if (res.confirm) {
        navigateToVipPurchase(book, Object.assign({ locked: true }, options))
      }
    }
  })
}

module.exports = {
  ENABLE_SERVICE_RIGHTS_REVIEW_MODE,
  getCurrentBook,
  isServiceRightsReviewMode,
  buildVipPurchaseQuery,
  navigateToVipPurchase,
  promptVipPurchase
}
