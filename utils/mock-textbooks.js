// 选教材弹窗的演示教材目录：仅在非 release 环境注入，
// 用于预览学段/版本分类、新课标标记和商品详情页的展示效果。
const { isTestPurchaseEnabled } = require('./dev-books')

function cover(index) {
  return '/images/home/mock-cover-' + (index < 10 ? '0' + index : index) + '.png'
}

function demoBook(id, name, stage, press, coverIndex, wordCount, newStandard) {
  return {
    resBookId: 'demo-' + id,
    name,
    stage,
    press,
    bookCover: cover(coverIndex),
    wordCount,
    newStandard: newStandard ? 1 : 0,
    needVip: 0,
    demo: true
  }
}

const MOCK_TEXTBOOKS = [
  // 小学 · 人教版PEP
  demoBook('pep-3a', '(新)三年级上册', '小学', '人教版PEP', 1, 312, true),
  demoBook('pep-3b', '三年级下册', '小学', '人教版PEP', 2, 328, false),
  demoBook('pep-4a', '四年级上册', '小学', '人教版PEP', 3, 356, false),
  demoBook('pep-4b', '四年级下册', '小学', '人教版PEP', 4, 371, false),
  demoBook('pep-5a', '五年级上册', '小学', '人教版PEP', 5, 402, false),
  demoBook('pep-5b', '五年级下册', '小学', '人教版PEP', 6, 415, false),
  // 小学 · 牛津译林版
  demoBook('yl-1a', '(新)一年级上册', '小学', '牛津译林版', 7, 186, true),
  demoBook('yl-1b', '一年级下册', '小学', '牛津译林版', 8, 198, false),
  demoBook('yl-2a', '二年级上册', '小学', '牛津译林版', 9, 224, false),
  demoBook('yl-2b', '二年级下册', '小学', '牛津译林版', 10, 236, false),
  demoBook('yl-3a', '(新)三年级上册', '小学', '牛津译林版', 1, 308, true),
  demoBook('yl-3b', '三年级下册', '小学', '牛津译林版', 2, 320, false),
  // 小学 · 外研版三起
  demoBook('wy3-3a', '(新)三年级上册', '小学', '外研版三起', 3, 295, true),
  demoBook('wy3-3b', '三年级下册', '小学', '外研版三起', 4, 310, false),
  demoBook('wy3-4a', '四年级上册', '小学', '外研版三起', 5, 342, false),
  demoBook('wy3-4b', '四年级下册', '小学', '外研版三起', 6, 358, false),
  // 初中 · 人教版
  demoBook('rj-7a', '(新)七年级上册', '初中', '人教版', 7, 486, true),
  demoBook('rj-7b', '七年级下册', '初中', '人教版', 8, 512, false),
  demoBook('rj-8a', '八年级上册', '初中', '人教版', 9, 548, false),
  demoBook('rj-8b', '八年级下册', '初中', '人教版', 10, 567, false),
  demoBook('rj-9', '九年级全一册', '初中', '人教版', 1, 624, false),
  // 初中 · 牛津译林版
  demoBook('yl-7a', '(新)七年级上册', '初中', '牛津译林版', 2, 478, true),
  demoBook('yl-7b', '七年级下册', '初中', '牛津译林版', 3, 502, false),
  demoBook('yl-8a', '八年级上册', '初中', '牛津译林版', 4, 539, false),
  // 高中 · 人教版
  demoBook('rjg-b1', '(新)必修 第一册', '高中', '人教版', 5, 692, true),
  demoBook('rjg-b2', '必修 第二册', '高中', '人教版', 6, 718, false),
  demoBook('rjg-b3', '必修 第三册', '高中', '人教版', 7, 735, false),
  demoBook('rjg-x1', '选择性必修 第一册', '高中', '人教版', 8, 764, false),
  // 高中 · 外研版
  demoBook('wyg-b1', '(新)必修 第一册', '高中', '外研版', 9, 686, true),
  demoBook('wyg-b2', '必修 第二册', '高中', '外研版', 10, 702, false)
]

// 在接口词书后追加演示教材；release 环境原样返回
function withMockTextbooks(books) {
  const list = Array.isArray(books) ? books : []
  if (!isTestPurchaseEnabled()) {
    return list
  }
  const existing = {}
  list.forEach(book => {
    if (book && book.resBookId) {
      existing[book.resBookId] = true
    }
  })
  return list.concat(MOCK_TEXTBOOKS.filter(book => !existing[book.resBookId]))
}

function isDemoTextbook(book) {
  return !!(book && book.demo)
}

module.exports = {
  MOCK_TEXTBOOKS,
  withMockTextbooks,
  isDemoTextbook
}
