const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')

function read(file) {
  return fs.readFileSync(path.join(projectRoot, file), 'utf8')
}

function assertPageFiles(pagePath) {
  for (const ext of ['js', 'json', 'wxml', 'wxss']) {
    assert.ok(
      fs.existsSync(path.join(projectRoot, `${pagePath}.${ext}`)),
      `${pagePath}.${ext} should exist`
    )
  }
}

test('me page menu entries navigate to complete secondary pages', () => {
  const appConfig = JSON.parse(read('app.json'))
  const meScript = read('pages/me/me.js')

  const secondaryPages = [
    'pages/me/book',
    'pages/me/notify',
    'pages/me/contact',
    'pages/me/privacy'
  ]

  for (const page of secondaryPages) {
    assert.ok(appConfig.pages.includes(page), `${page} should be registered`)
    assertPageFiles(page)
  }

  assert.match(meScript, /url:\s*'\/pages\/me\/book'/)
  assert.match(meScript, /url:\s*'\/pages\/me\/notify'/)
  assert.match(meScript, /url:\s*'\/pages\/me\/contact'/)
  assert.match(meScript, /url:\s*'\/pages\/me\/privacy'/)
  assert.doesNotMatch(meScript, /showPending\(\)/)
})

test('me secondary pages provide real page content', () => {
  const bookPage = read('pages/me/book.wxml')
  const notifyPage = read('pages/me/notify.wxml')
  const contactPage = read('pages/me/contact.wxml')
  const privacyPage = read('pages/me/privacy.wxml')

  assert.match(bookPage, /当前教材/)
  assert.match(bookPage, /学习进度/)
  assert.match(bookPage, /切换教材/)

  assert.match(notifyPage, /订阅消息/)
  assert.match(notifyPage, /公众号提醒/)
  assert.match(notifyPage, /bindtap="requestSubscribe"/)

  assert.match(contactPage, /联系客服/)
  assert.match(contactPage, /open-type="contact"/)
  assert.match(contactPage, /常见问题/)

  assert.match(privacyPage, /隐私与协议/)
  assert.match(privacyPage, /用户协议/)
  assert.match(privacyPage, /隐私政策/)
})
