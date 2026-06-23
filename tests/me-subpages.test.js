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
  assert.match(meScript, /url:\s*'\/pages\/me\/contact'/)
  assert.match(meScript, /url:\s*'\/pages\/me\/privacy'/)
  assert.doesNotMatch(meScript, /showPending\(\)/)

  // 「开启学习提醒」进订阅详情页；隐私/客服页也可进入
  assert.match(meScript, /url:\s*'\/pages\/me\/notify'/)
  const privacyScript = read('pages/me/privacy.js')
  const contactScript = read('pages/me/contact.js')
  assert.match(privacyScript, /url:\s*'\/pages\/me\/notify'/)
  assert.match(contactScript, /url:\s*'\/pages\/me\/notify'/)
})

test('me secondary pages provide real page content', () => {
  const bookPage = read('pages/me/book.wxml')
  const notifyPage = read('pages/me/notify.wxml')
  const contactPage = read('pages/me/contact.wxml')
  const privacyPage = read('pages/me/privacy.wxml')

  assert.match(bookPage, /已购买/)
  assert.match(bookPage, /继续学习/)
  assert.match(bookPage, /bindtap="continueStudy"/)
  assert.match(bookPage, /class="book-count"/)
  assert.match(bookPage, /class="book-row-card/)
  assert.match(bookPage, /class="row-progress-fill"/)
  assert.doesNotMatch(bookPage, /学习进度/)
  assert.doesNotMatch(bookPage, /切换教材/)
  assert.doesNotMatch(bookPage, /解锁/)

  assert.match(notifyPage, /订阅消息/)
  assert.doesNotMatch(notifyPage, /公众号提醒/)
  // 按模板分开订阅：打卡累计次数，事件型提醒只做偏好开关
  assert.match(notifyPage, /bindtap="previewTemplate"/)
  assert.match(notifyPage, /class="preview-mask"/)
  assert.match(notifyPage, /消息样式预览/)
  assert.match(notifyPage, /preview-hint-icon/)
  assert.match(notifyPage, /preview-hint-arrow/)
  assert.match(notifyPage, /catchtap="subscribeOne"/)
  assert.match(notifyPage, /bindchange="toggleTemplatePref"/)
  assert.match(notifyPage, /wx:for="{{templates}}"/)
  assert.match(notifyPage, /已累计订阅/)
  assert.match(notifyPage, /提醒开关/)
  assert.match(notifyPage, /提醒时机/)
  assert.doesNotMatch(notifyPage, /bindtap="openOfficialAccount"/)
  assert.doesNotMatch(notifyPage, />未设置</)

  assert.match(contactPage, /联系客服/)
  assert.match(contactPage, /open-type="contact"/)
  assert.match(contactPage, /常见问题/)

  assert.match(privacyPage, /隐私与协议/)
  assert.match(privacyPage, /用户协议/)
  assert.match(privacyPage, /隐私政策/)
})

test('subscribe templates distinguish accumulated checkin from event preferences', () => {
  global.wx = {
    getStorageSync() {
      return ''
    }
  }
  delete require.cache[require.resolve('../utils/subscribe')]
  const { getSubscribeTemplates } = require('../utils/subscribe')
  const templates = getSubscribeTemplates()

  const checkin = templates.find(item => item.title === '打卡提醒')
  assert.equal(checkin.mode, 'accumulate')
  assert.equal(checkin.id, 'wIiz5RXzkJYLp0pw63mEUpYqS2zSRSet1P_afBV58k0')
  assert.equal(checkin.countKey, 'checkinRemindCount')
  assert.equal(checkin.prefKey, 'subscribePref_checkin')

  const payment = templates.find(item => item.id === 'RpsH9zwTbY6f4zV6WhmuPZ096nfwJj95guxKOwy03nE')
  assert.equal(payment.title, '支付成功通知')
  assert.equal(payment.mode, 'event')
  assert.equal(payment.prefKey, 'subscribePref_payment')

  const report = templates.find(item => item.id === 'Bq5QCQ0Km8XTBapXuDavgzC0YrjUupVxJ_Hob0hmch4')
  assert.equal(report.title, '学习报告通知')
  assert.equal(report.mode, 'event')
  assert.equal(report.prefKey, 'subscribePref_report')
})

test('event subscribe prompts are not auto-requested at payment and report completion', () => {
  const vipScript = read('pages/vip/vip.js')
  const practiceScript = read('pages/practice/practice.js')
  const listenScript = read('pages/listen/listen.js')
  const examScript = read('pages/exam/exam.js')
  const membershipScript = read('pages/membership/membership.js')

  for (const script of [vipScript, practiceScript, listenScript, examScript, membershipScript]) {
    assert.doesNotMatch(script, /requestSubscribeForEvent/)
  }
})
