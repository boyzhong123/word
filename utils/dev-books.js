// 购买流程测试用的本地词书：仅在非 release 环境注入，
// 购买状态记录在本地 storage，不依赖后端。
const ENABLE_TEST_PURCHASE_BOOK = true

const TEST_BOOK_ID = 'dev-test-book-001'
const STORAGE_KEY = 'devPurchasedBooks'

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
  const ids = wx.getStorageSync(STORAGE_KEY)
  return Array.isArray(ids) ? ids : []
}

function isDevPurchased(resBookId) {
  return !!resBookId && getDevPurchasedIds().indexOf(resBookId) >= 0
}

function markDevPurchased(resBookId) {
  if (!resBookId || isDevPurchased(resBookId)) {
    return
  }
  wx.setStorageSync(STORAGE_KEY, getDevPurchasedIds().concat(resBookId))
}

function clearDevPurchased() {
  wx.removeStorageSync(STORAGE_KEY)
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
  const testBook = Object.assign({}, TEST_BOOK)
  if (isDevPurchased(TEST_BOOK_ID)) {
    testBook.unlocked = 1
    testBook.needVip = 0
  }
  return list.concat(testBook)
}

module.exports = {
  TEST_BOOK_ID,
  isTestPurchaseEnabled,
  isDevTestBook,
  isDevPurchased,
  markDevPurchased,
  clearDevPurchased,
  withTestBook
}
