const OFFICIAL_ACCOUNT_ARTICLE_URL = 'https://mp.weixin.qq.com/s/KqjPHbzzfzQMNFqiArFVsQ'
const OFFICIAL_ACCOUNT_FOLLOWED_KEY = 'officialAccountFollowed'

function getOfficialAccountWebSrcPath() {
  return `/pages/me/web-src?url=${encodeURIComponent(OFFICIAL_ACCOUNT_ARTICLE_URL)}`
}

function getOfficialAccountFollowed() {
  return !!wx.getStorageSync(OFFICIAL_ACCOUNT_FOLLOWED_KEY)
}

function markOfficialAccountFollowed() {
  wx.setStorageSync(OFFICIAL_ACCOUNT_FOLLOWED_KEY, 1)
}

module.exports = {
  OFFICIAL_ACCOUNT_ARTICLE_URL,
  OFFICIAL_ACCOUNT_FOLLOWED_KEY,
  getOfficialAccountWebSrcPath,
  getOfficialAccountFollowed,
  markOfficialAccountFollowed
}
