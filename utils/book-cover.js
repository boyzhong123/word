const { imageUrl } = require('./image-host')

const FALLBACK_BOOK_COVER = '/images/home/book-cover.png'

function getBaseUrl() {
  try {
    return (getApp().globalData && getApp().globalData.BASE_URL) || ''
  } catch (error) {
    return ''
  }
}

function getFallbackBookCover() {
  return imageUrl(FALLBACK_BOOK_COVER)
}

function normalizeBookCover(cover) {
  const value = String(cover || '').trim()
  if (!value) {
    return getFallbackBookCover()
  }
  if (/^\/\//.test(value)) {
    return 'https:' + value
  }
  if (/^http:\/\//.test(value)) {
    return 'https://' + value.slice(7)
  }
  if (/^https:\/\//.test(value)) {
    return value
  }
  if (/^(\.\.\/|\.\/)/.test(value)) {
    return value
  }
  if (/^\/?images\//.test(value)) {
    return imageUrl(value.replace(/^\/?/, '/'))
  }

  const baseUrl = getBaseUrl().replace(/\/$/, '')
  if (baseUrl && value.charAt(0) === '/') {
    return baseUrl + value
  }
  if (baseUrl) {
    return baseUrl + '/' + value.replace(/^\/+/, '')
  }
  return getFallbackBookCover()
}

module.exports = {
  FALLBACK_BOOK_COVER,
  getFallbackBookCover,
  normalizeBookCover
}
