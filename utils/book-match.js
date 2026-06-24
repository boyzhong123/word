// 教材推荐匹配：新手引导采集的 年级/学期/版本 → 命中 user-books 真实目录里的一本教材。
// 词书应带 version / gradeId / semesterId；缺字段时从书名解析，无学期标签一律按上学期(first)。
// 详见 docs/mini-app-tech-doc.html「⓪ 新手引导 · 教材联动」。

const GRADE_NUMERALS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }

function normalizeVersion(value) {
  return String(value || '').replace(/\s+/g, '')
}

// 从书名解析年级，如「(新)三年级上册」→ g3；高中「必修 第一册」无法解析返回空
function parseGradeIdFromName(name) {
  const match = String(name || '').match(/([一二三四五六七八九])年级/)
  return match ? 'g' + GRADE_NUMERALS[match[1]] : ''
}

// 从书名解析学期，下册/下学期→second，上册/上学期→first，无标签返回空（由调用方按上学期兜底）
function parseSemesterIdFromName(name) {
  const text = String(name || '')
  if (text.indexOf('下册') >= 0 || text.indexOf('下学期') >= 0) {
    return 'second'
  }
  if (text.indexOf('上册') >= 0 || text.indexOf('上学期') >= 0) {
    return 'first'
  }
  return ''
}

function getBookVersion(book) {
  return normalizeVersion(book && (book.version || book.press))
}

function getBookGradeId(book) {
  if (!book) {
    return ''
  }
  return book.gradeId || parseGradeIdFromName(book.name || book.bookName)
}

// 无学期标签的书按上学期(first)
function getBookSemesterId(book) {
  if (!book) {
    return 'first'
  }
  return book.semesterId || parseSemesterIdFromName(book.name || book.bookName) || 'first'
}

// 按 version + gradeId + semesterId 命中目录里的一本书；
// 无精确命中退到同版本同年级任一册；仍无返回 null（调用方回退后端 defaultBook）。
function matchRecommendedBook(books, profile) {
  if (!Array.isArray(books) || !books.length || !profile) {
    return null
  }
  const version = normalizeVersion(profile.version)
  const gradeId = profile.gradeId
  const semesterId = profile.semesterId || 'first'
  if (!version || !gradeId) {
    return null
  }
  const candidates = books.filter(book => getBookVersion(book) === version)
  if (!candidates.length) {
    return null
  }
  const exact = candidates.find(book =>
    getBookGradeId(book) === gradeId && getBookSemesterId(book) === semesterId
  )
  if (exact) {
    return exact
  }
  return candidates.find(book => getBookGradeId(book) === gradeId) || null
}

module.exports = {
  normalizeVersion,
  parseGradeIdFromName,
  parseSemesterIdFromName,
  getBookVersion,
  getBookGradeId,
  getBookSemesterId,
  matchRecommendedBook
}
