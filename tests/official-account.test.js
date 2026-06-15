const test = require('node:test')
const assert = require('node:assert/strict')
const {
  OFFICIAL_ACCOUNT_ARTICLE_URL,
  getOfficialAccountWebSrcPath
} = require('../utils/official-account')

test('official account article url matches miniprogram-parent subscribe link', () => {
  assert.equal(
    OFFICIAL_ACCOUNT_ARTICLE_URL,
    'https://mp.weixin.qq.com/s/KqjPHbzzfzQMNFqiArFVsQ'
  )
  assert.match(
    getOfficialAccountWebSrcPath(),
    /^\/pages\/me\/web-src\?url=/
  )
})
