const { isProverbsDictionaryBook } = require('./book-select')

function isTruthyFlag(value) {
  return value === true || value === 1 || value === '1'
}

// 新课标教材：优先看后端显式标记，没有就从名称/简介/版本字段里识别
function isNewStandardBook(book) {
  if (!book) {
    return false
  }
  if (isProverbsDictionaryBook(book)) {
    return true
  }
  if (isTruthyFlag(book.newStandard) || isTruthyFlag(book.isNewStandard)) {
    return true
  }
  const text = [book.name, book.intro, book.edition, book.version, book.tags]
    .filter(Boolean)
    .join(' ')
  return text.indexOf('新课标') >= 0
}

module.exports = {
  isTruthyFlag,
  isNewStandardBook
}
