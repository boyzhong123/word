// 统一跳转 VIP 购买详情页（advertisement），替代旧的 membership 黑金页。
function getCurrentBook() {
  const app = getApp()
  return (app && app.globalData && app.globalData.book) || {}
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
  return parts.join('&')
}

function navigateToVipPurchase(book, options = {}) {
  const query = buildVipPurchaseQuery(book, options)
  const navigateOptions = {
    url: '/pages/advertisement/advertisement?' + query
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

module.exports = {
  getCurrentBook,
  buildVipPurchaseQuery,
  navigateToVipPurchase
}
