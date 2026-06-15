const OFFICIAL_ACCOUNT_ARTICLE_URL = 'https://mp.weixin.qq.com/s/KqjPHbzzfzQMNFqiArFVsQ'

function getOfficialAccountWebSrcPath() {
  return `/pages/me/web-src?url=${encodeURIComponent(OFFICIAL_ACCOUNT_ARTICLE_URL)}`
}

module.exports = {
  OFFICIAL_ACCOUNT_ARTICLE_URL,
  getOfficialAccountWebSrcPath
}
