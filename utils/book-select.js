// 当前教材选择：新手引导完成时已按档案（年级/学期/版本）匹配并切默认词书（见 onboarding.applyRecommendedBook +
// utils/book-match.js），结果通过 globalData.pendingBookId 传入；本模块只按 preferredResBookId / defaultBook 选当前书，
// 不再二次按 studentProfile 匹配。默认学习书保持接口 defaultBook；若无标记则优先「格言谚语词典」。
function isProverbsDictionaryBook(book) {
  if (!book) {
    return false
  }
  const name = String(book.name || book.bookName || '')
  return name.indexOf('格言') >= 0 || name.indexOf('谚语') >= 0
}

function isOwnedBook(book) {
  return !!(book && (book.unlocked || book.defaultBook || !book.needVip))
}

// preferredResBookId：用户刚手动切换的教材；其余情况不根据 studentProfile 匹配同步教材。
function pickActiveBook(list, preferredResBookId) {
  if (!Array.isArray(list) || !list.length) {
    return null
  }
  if (preferredResBookId) {
    const matched = list.find(item => item && item.resBookId === preferredResBookId)
    if (matched) {
      return matched
    }
  }
  const defaultBook = list.find(item => item && item.defaultBook)
  if (defaultBook) {
    return defaultBook
  }
  const proverbBook = list.find(isProverbsDictionaryBook)
  if (proverbBook) {
    return proverbBook
  }
  const owned = list.filter(isOwnedBook)
  return owned[0] || list[0]
}

// 确保 globalData.book 有 resBookId（伴读 Tab 可能在今日/成长加载教材前被点开）。
function ensureActiveBook() {
  const app = getApp()
  const globalData = app.globalData || {}
  const preferredResBookId = globalData.pendingBookId ||
    (globalData.book && globalData.book.resBookId) ||
    ''
  if (preferredResBookId && globalData.book && globalData.book.resBookId === preferredResBookId) {
    return Promise.resolve(globalData.book)
  }
  const { login } = require('./login')
  const { getUserBooks } = require('./api')
  const { withTestBook, applyDevPurchaseToBooks } = require('./dev-books')
  const { withMockTextbooks } = require('./mock-textbooks')

  return login().then(result => {
    if (!result || !result.logined) {
      return null
    }
    return getUserBooks()
  }).then(books => {
    const list = applyDevPurchaseToBooks(withMockTextbooks(withTestBook(Array.isArray(books) ? books : [])))
    const book = pickActiveBook(list, preferredResBookId)
    if (book && book.resBookId) {
      globalData.book = Object.assign({}, globalData.book, book)
    }
    return book
  }).catch(() => null)
}

module.exports = {
  isProverbsDictionaryBook,
  pickActiveBook,
  ensureActiveBook
}
