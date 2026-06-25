// 购买流程测试用的本地词书：仅在非 release 环境注入。
// 已购状态是后端业务真值（购买成功后端记录），前端不持久化：收口到 mock-store 的
// purchasedBookIds slice。
const mockStore = require('./mock/mock-store')

const ENABLE_TEST_PURCHASE_BOOK = true

const TEST_BOOK_ID = 'dev-test-book-001'

const TEST_BOOK = {
  resBookId: TEST_BOOK_ID,
  name: '初中英语词汇格言谚语词典',
  bookCover: '/images/home/book-cover.png',
  press: '商务印书馆',
  wordCount: 1536,
  proverbCount: 4208,
  total: 4,
  intro: '精选初中阶段核心词汇与经典英文格言谚语，配套智能学习卡、跟读评分与记忆曲线复习，帮助学生在语境中牢固掌握单词。',
  needVip: 1
}

function isTestPurchaseEnabled() {
  if (!ENABLE_TEST_PURCHASE_BOOK) {
    return false
  }
  try {
    return wx.getAccountInfoSync().miniProgram.envVersion !== 'release'
  } catch (error) {
    return false
  }
}

function isDevTestBook(resBookId) {
  return resBookId === TEST_BOOK_ID
}

function getDevPurchasedIds() {
  const ids = mockStore.getSlice('purchasedBookIds')
  return Array.isArray(ids) ? ids : []
}

function isDevPurchased(resBookId) {
  return !!resBookId && getDevPurchasedIds().indexOf(resBookId) >= 0
}

function markDevPurchased(resBookId) {
  if (!resBookId || isDevPurchased(resBookId)) {
    return
  }
  // 接后端：购买由后端记录，这里改为重新拉 user-books / 已购列表
  mockStore.setSlice('purchasedBookIds', getDevPurchasedIds().concat(resBookId))
}

function applyDevPurchaseToBook(book) {
  if (!book || !book.resBookId || !isDevPurchased(book.resBookId)) {
    return book
  }
  return Object.assign({}, book, {
    unlocked: 1,
    needVip: 0
  })
}

function applyDevPurchaseToBooks(books) {
  return (Array.isArray(books) ? books : []).map(applyDevPurchaseToBook)
}

function clearDevPurchased() {
  mockStore.setSlice('purchasedBookIds', [])
}

// 在书单末尾追加测试词书；已购买则带上 unlocked 标记
function withTestBook(books) {
  const list = Array.isArray(books) ? books : []
  if (!isTestPurchaseEnabled()) {
    return list
  }
  if (list.some(book => book && book.resBookId === TEST_BOOK_ID)) {
    return list
  }
  const testBook = applyDevPurchaseToBook(Object.assign({}, TEST_BOOK))
  return list.concat(testBook)
}

module.exports = {
  TEST_BOOK_ID,
  isTestPurchaseEnabled,
  isDevTestBook,
  isDevPurchased,
  markDevPurchased,
  applyDevPurchaseToBook,
  applyDevPurchaseToBooks,
  clearDevPurchased,
  withTestBook
}
