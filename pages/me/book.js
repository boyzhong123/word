const { getUserBooks, toggleBook } = require('../../utils/api')
const { login } = require('../../utils/login')
const { withTestBook, isDevTestBook } = require('../../utils/dev-books')

const FALLBACK_COVER = '../../images/home/book-cover.png'

function pickNumber() {
  for (let i = 0; i < arguments.length; i++) {
    const value = Number(arguments[i])
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }
  return 0
}

function isTruthy(value) {
  return value === true || value === 1 || value === '1'
}

function isLocked(book) {
  if (!book) {
    return false
  }
  if (book.unlocked !== undefined && book.unlocked !== null && book.unlocked !== '') {
    return !isTruthy(book.unlocked)
  }
  return isTruthy(book.needVip)
}

function normalizeBook(book, currentId) {
  const source = book || {}
  const learningInfo = source.learningInfo || {}
  const progress = learningInfo.book || {}
  const totalWords = pickNumber(source.wordCount, progress.totalWords, progress.wordCount)
  const learnedWords = pickNumber(progress.learningWords, source.learningWords)
  const percent = totalWords ? Math.min(Math.round(learnedWords * 100 / totalWords), 100) : 0
  const resBookId = source.resBookId || source.id || ''

  return {
    resBookId,
    name: source.name || source.bookName || '未命名教材',
    press: source.press || source.publisher || '精选教材',
    intro: source.intro || source.description || '按关卡推进单词、跟读和听力小测。',
    bookCover: source.bookCover || source.cover || FALLBACK_COVER,
    totalWords,
    learnedWords,
    proverbCount: pickNumber(source.proverbCount),
    percent,
    progressStyle: 'width: ' + percent + '%;',
    current: isTruthy(source.defaultBook) || (!!currentId && resBookId === currentId),
    locked: isLocked(source)
  }
}

Page({
  data: {
    loading: true,
    empty: false,
    currentBook: null,
    books: [],
    summary: {
      bookCount: 0,
      learnedWords: 0,
      totalWords: 0
    }
  },

  onLoad() {
    this.loadBooks()
  },

  onShow() {
    if (this.refresh) {
      this.refresh = false
      this.loadBooks()
    }
  },

  loadBooks() {
    this.setData({ loading: true })
    login().then(result => {
      if (!result || !result.logined) {
        this.setData({ loading: false, empty: true, books: [], currentBook: null })
        return []
      }
      return getUserBooks()
    }).then(books => {
      if (!Array.isArray(books)) {
        return
      }
      const list = withTestBook(books)
      const currentSource = list.find(item => isTruthy(item.defaultBook)) || list[0] || null
      const currentId = currentSource && (currentSource.resBookId || currentSource.id)
      const normalized = list.map(item => normalizeBook(item, currentId))
      const currentBook = normalized.find(item => item.current) || normalized[0] || null
      const totalWords = normalized.reduce((total, item) => total + item.totalWords, 0)
      const learnedWords = normalized.reduce((total, item) => total + item.learnedWords, 0)

      this.setData({
        loading: false,
        empty: !normalized.length,
        books: normalized,
        currentBook,
        summary: {
          bookCount: normalized.length,
          learnedWords,
          totalWords
        }
      })
    }).catch(error => {
      console.log('[me/book] load failed', error)
      this.setData({ loading: false, empty: true })
    })
  },

  switchBook(event) {
    const resBookId = event.currentTarget.dataset.resBookId
    const target = (this.data.books || []).find(item => item.resBookId === resBookId)
    if (!target) {
      return
    }
    if (target.locked) {
      wx.navigateTo({
        url: '/pages/vip/vip?resBookId=' + encodeURIComponent(target.resBookId) +
          '&name=' + encodeURIComponent(target.name)
      })
      return
    }
    if (target.current) {
      wx.showToast({ title: '已是当前教材', icon: 'none' })
      return
    }
    if (isDevTestBook(resBookId)) {
      wx.showToast({ title: '测试词书仅用于演示购买流程', icon: 'none' })
      return
    }

    toggleBook(resBookId).then(() => {
      const books = (this.data.books || []).map(item => Object.assign({}, item, {
        current: item.resBookId === resBookId
      }))
      const currentBook = books.find(item => item.current) || target
      getApp().globalData.book = currentBook
      this.setData({ books, currentBook })
      wx.showToast({ title: '已切换教材', icon: 'success' })
    })
  },

  openCatalogue() {
    const book = this.data.currentBook
    if (!book || !book.resBookId) {
      return
    }
    wx.navigateTo({
      url: '/pages/catalogue/catalogue?resBookId=' + encodeURIComponent(book.resBookId) +
        '&name=' + encodeURIComponent(book.name)
    })
  },

  startStudy() {
    wx.switchTab({ url: '/pages/home/home' })
  }
})
