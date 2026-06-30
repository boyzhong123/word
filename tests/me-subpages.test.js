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

  assert.match(bookPage, /已学书本/)
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
  const { CHECKIN_REMIND_TIME, getSubscribeTemplates } = require('../utils/subscribe')
  const templates = getSubscribeTemplates()

  const checkin = templates.find(item => item.title === '打卡提醒')
  assert.equal(CHECKIN_REMIND_TIME, '08:30')
  assert.equal(checkin.mode, 'accumulate')
  assert.equal(checkin.id, 'wIiz5RXzkJYLp0pw63mEUpYqS2zSRSet1P_afBV58k0')
  assert.equal(checkin.countKey, 'checkinRemindCount')
  assert.equal(checkin.prefKey, 'subscribePref_checkin')
  assert.equal(checkin.when, '每天 8:30 提醒完成今日学习')
  assert.ok(checkin.previewFields.some(item => item.value === '08:30:00'))

  const payment = templates.find(item => item.id === 'RpsH9zwTbY6f4zV6WhmuPZ096nfwJj95guxKOwy03nE')
  assert.equal(payment.title, '支付成功通知')
  assert.equal(payment.mode, 'event')
  assert.equal(payment.prefKey, 'subscribePref_payment')
  assert.deepEqual(
    payment.previewFields.map(item => item.key),
    ['thing1', 'amount2', 'time3', 'thing4']
  )

  const report = templates.find(item => item.id === 'Bq5QCQ0Km8XTBapXuDavgzC0YrjUupVxJ_Hob0hmch4')
  assert.equal(report.title, '学习报告通知')
  assert.equal(report.mode, 'event')
  assert.equal(report.prefKey, 'subscribePref_report')
})

test('event subscribe prompts are not auto-requested at report completion', () => {
  const practiceScript = read('pages/practice/practice.js')

  for (const script of [practiceScript]) {
    assert.doesNotMatch(script, /requestSubscribeForEvent/)
  }
})

test('checkin subscription reports the fixed 8:30 reminder to backend', () => {
  const notifyScript = read('pages/me/notify.js')
  const calendarScript = read('pages/checkin/calendar.js')

  for (const script of [notifyScript, calendarScript]) {
    assert.match(script, /source:\s*'accumulate'/)
    assert.match(script, /remindTime:\s*CHECKIN_REMIND_TIME/)
    assert.match(script, /page:\s*'\/pages\/checkin\/calendar'/)
  }
})

test('payment success template data fills checked WeChat fields', () => {
  global.wx = {
    getStorageSync() {
      return ''
    }
  }
  delete require.cache[require.resolve('../utils/subscribe')]
  const { buildPaymentSuccessMessageData } = require('../utils/subscribe')

  const data = buildPaymentSuccessMessageData({
    tierName: '1年会员',
    price: 109,
    createdAt: '2026-06-30 21:08',
    expireText: '2027-06-30'
  })

  assert.deepEqual(data, {
    thing1: { value: '1年会员' },
    amount2: { value: '109.00元' },
    time3: { value: '2026-06-30 21:08' },
    thing4: { value: '课本解锁至2027-06-30，开始学习' }
  })
})

test('report template data and pages target the generated report detail', () => {
  global.wx = {
    getStorageSync() {
      return ''
    }
  }
  delete require.cache[require.resolve('../utils/subscribe')]
  const {
    buildReportMessageData,
    buildUnitReportPage,
    buildExamReportPage
  } = require('../utils/subscribe')

  assert.deepEqual(buildReportMessageData({
    reportType: '关卡学习报告',
    durationText: '约5分钟',
    score: 96,
    remark: '本关报告已生成，复盘再闯关'
  }), {
    thing1: { value: '关卡学习报告' },
    thing2: { value: '约5分钟' },
    number3: { value: '96' },
    thing4: { value: '本关报告已生成，复盘再闯关' }
  })

  assert.equal(
    buildUnitReportPage({
      resBookId: 'rb1',
      unitId: 'u1',
      sort: 3,
      words: 12,
      en: 'Great report',
      zh: '关卡报告'
    }),
    '/pages/report/report?resBookId=rb1&unitId=u1&sort=3&words=12&en=Great%20report&zh=%E5%85%B3%E5%8D%A1%E6%8A%A5%E5%91%8A'
  )
  assert.equal(
    buildExamReportPage({ resBookId: 'rb1', type: 'exit', name: '七年级上' }),
    '/pages/exam/exam-report?resBookId=rb1&type=exit&name=%E4%B8%83%E5%B9%B4%E7%BA%A7%E4%B8%8A'
  )
})

test('unit and exam report completions request report notification pages', () => {
  const finishScript = read('pages/finish/today.js')
  const examScript = read('pages/exam/exam.js')

  assert.match(finishScript, /buildUnitReportPage/)
  assert.match(finishScript, /requestSubscribeForEvent\('subscribePref_report'/)
  assert.match(finishScript, /reportType:\s*'unit'/)

  assert.match(examScript, /buildExamReportPage/)
  assert.match(examScript, /requestSubscribeForEvent\('subscribePref_report'/)
  assert.match(examScript, /reportType:\s*this\.examType/)
  assert.match(examScript, /入门测评报告/)
  assert.match(examScript, /摸清基础，学习更有方向/)
  assert.match(examScript, /结业测评报告/)
  assert.match(examScript, /结业成果已生成，看看进步/)
})

test('notification click pages point to registered target pages', () => {
  const appConfig = JSON.parse(read('app.json'))
  const { buildUnitReportPage, buildExamReportPage } = require('../utils/subscribe')
  const pages = [
    '/pages/membership-success/membership-success?orderId=VIP8123456789',
    buildUnitReportPage({ resBookId: 'rb1', unitId: 'u1', sort: 3, words: 12 }),
    buildExamReportPage({ resBookId: 'rb1', type: 'entry', name: '七年级上' }),
    buildExamReportPage({ resBookId: 'rb1', type: 'exit', name: '七年级上' })
  ]

  for (const page of pages) {
    const route = page.replace(/^\//, '').split('?')[0]
    assert.ok(appConfig.pages.includes(route), `${route} should be registered`)
  }
})
