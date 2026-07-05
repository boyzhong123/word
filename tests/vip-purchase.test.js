const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const {
  buildVipPurchaseQuery,
  navigateToVipPurchase
} = require('../utils/vip-purchase')

const projectRoot = path.resolve(__dirname, '..')

function loadMembershipPage(options) {
  let pageConfig
  global.getApp = () => ({ globalData: {} })
  global.wx = {
    getWindowInfo: () => ({
      windowHeight: 800,
      safeArea: { bottom: 780 }
    }),
    getStorageSync: () => null,
    setStorageSync() {},
    removeStorageSync() {},
    getStorageInfoSync: () => ({ keys: [] }),
    showToast() {},
    redirectTo() {}
  }
  global.Page = config => {
    pageConfig = config
  }

  delete require.cache[require.resolve('../pages/membership/membership')]
  require('../pages/membership/membership')

  const page = Object.assign({}, pageConfig, {
    data: JSON.parse(JSON.stringify(pageConfig.data)),
    setData(update) {
      Object.assign(this.data, update)
    },
    loadProfile() {}
  })
  page.onLoad(options)
  return page
}

test('buildVipPurchaseQuery encodes the current book context', () => {
  const query = buildVipPurchaseQuery({
    resBookId: 'book-2',
    name: '(新)七年级上册',
    bookCover: '/cover.png',
    wordCount: 486,
    proverbCount: 0,
    total: 12,
    press: '人教版',
    locked: true
  })

  assert.match(query, /resBookId=book-2/)
  assert.match(query, /name=\(%E6%96%B0\)/)
  assert.match(query, /unlocked=0/)
  assert.match(query, /press=%E4%BA%BA%E6%95%99%E7%89%88/)
})

test('navigateToVipPurchase opens membership page and preserves the sku intent', () => {
  const calls = []
  global.wx = {
    navigateTo(options) {
      calls.push(options)
    }
  }
  global.getApp = () => ({ globalData: { book: {} } })

  navigateToVipPurchase(
    { resBookId: 'demo', name: 'Demo', locked: true },
    { openSku: true }
  )

  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /\/pages\/membership\/membership\?/)
  assert.match(calls[0].url, /resBookId=demo/)
  assert.match(calls[0].url, /openSku=1/)
  assert.doesNotMatch(calls[0].url, /audit=1/)
})

test('buildVipPurchaseQuery supports audit display mode', () => {
  const query = buildVipPurchaseQuery(
    { resBookId: 'demo', name: 'Demo', locked: true },
    { audit: true }
  )

  assert.match(query, /audit=1/)
})

test('vip purchase query does not enter service rights review mode by default', () => {
  const query = buildVipPurchaseQuery(
    { resBookId: 'demo', name: 'Demo', locked: true }
  )

  assert.doesNotMatch(query, /audit=1/)
})

test('promptVipPurchase uses membership copy by default', () => {
  const calls = []
  global.wx = {
    showModal(options) {
      calls.push(options)
    }
  }

  const { promptVipPurchase } = require('../utils/vip-purchase')
  promptVipPurchase({ resBookId: 'demo', name: 'Demo', locked: true })

  assert.equal(calls.length, 1)
  assert.equal(calls[0].title, '会员专享内容')
  assert.equal(calls[0].confirmText, '去开通')
  assert.match(calls[0].content, /会员|开通/)
})

test('promptVipPurchase uses service rights copy when audit mode is enabled', () => {
  const calls = []
  global.wx = {
    showModal(options) {
      calls.push(options)
    }
  }

  const { promptVipPurchase } = require('../utils/vip-purchase')
  promptVipPurchase({ resBookId: 'demo', name: 'Demo', locked: true }, { audit: true })

  assert.equal(calls.length, 1)
  assert.equal(calls[0].title, '产品介绍')
  assert.equal(calls[0].confirmText, '查看')
  assert.doesNotMatch(calls[0].content, /会员|开通/)
})

test('membership page can still open the sku confirmation when review mode is disabled explicitly', () => {
  const page = loadMembershipPage({ tierId: 'm2', openSku: '1', audit: '0' })

  assert.equal(page.data.selectedTierId, 'm2')
  assert.equal(page.data.showConfirm, true)
})

test('membership page opens payment sheet by default when openSku is set', () => {
  const page = loadMembershipPage({ tierId: 'm2', openSku: '1' })

  assert.equal(page.data.auditMode, false)
  assert.equal(page.data.showConfirm, true)
})

test('membership page enters audit display mode when audit=1 without opening payment sheet', () => {
  const page = loadMembershipPage({ tierId: 'm2', openSku: '1', audit: '1' })

  assert.equal(page.data.auditMode, true)
  assert.equal(page.data.showConfirm, false)
  assert.equal(page.data.auditPosterImages.length, 3)
  assert.match(page.data.auditPosterImages[0], /service-rights-word-sentence\.png\?v=20260703-service-rights-v1$/)
  assert.match(page.data.auditPosterImages[1], /service-rights-online-user\.png\?v=20260703-service-rights-v1$/)
  assert.match(page.data.auditPosterImages[2], /service-rights-ten-minutes\.png\?v=20260703-service-rights-v1$/)
})

test('membership payment success requests the payment success template with order fields', async () => {
  const page = loadMembershipPage({ tierId: 'm1' })
  const subscribeCalls = []
  let reportedPayload = null
  global.wx.requestSubscribeMessage = options => {
    subscribeCalls.push(options)
    options.success({
      RpsH9zwTbY6f4zV6WhmuPZ096nfwJj95guxKOwy03nE: 'accept'
    })
  }
  const api = require('../utils/api')
  const originalReport = api.reportSubscribeMessageQuota
  api.reportSubscribeMessageQuota = payload => {
    reportedPayload = payload
    return Promise.resolve(true)
  }

  try {
    page.onSuccess(page.data.currentTier, false, false)
    await new Promise(resolve => setTimeout(resolve, 0))
  } finally {
    api.reportSubscribeMessageQuota = originalReport
  }

  assert.equal(subscribeCalls.length, 1)
  assert.deepEqual(subscribeCalls[0].tmplIds, ['RpsH9zwTbY6f4zV6WhmuPZ096nfwJj95guxKOwy03nE'])
  assert.equal(reportedPayload.tmplId, 'RpsH9zwTbY6f4zV6WhmuPZ096nfwJj95guxKOwy03nE')
  assert.equal(reportedPayload.orderId.startsWith('VIP'), true)
  assert.deepEqual(Object.keys(reportedPayload.messageData), ['thing1', 'amount2', 'time3', 'thing4'])
  assert.equal(reportedPayload.messageData.thing1.value, '1个月会员')
  assert.equal(reportedPayload.messageData.amount2.value, '39.00元')
  assert.match(reportedPayload.messageData.thing4.value, /^课本解锁至\d{4}-\d{2}-\d{2}，开始学习$/)
  assert.ok(reportedPayload.messageData.thing4.value.length <= 20)
  assert.match(reportedPayload.page, /^\/pages\/membership-success\/membership-success\?orderId=VIP/)
})

test('membership redeem success also reports payment template with zero amount', async () => {
  const page = loadMembershipPage({ tierId: 'm1' })
  let reportedPayload = null
  global.wx.requestSubscribeMessage = options => {
    options.success({
      RpsH9zwTbY6f4zV6WhmuPZ096nfwJj95guxKOwy03nE: 'accept'
    })
  }
  const api = require('../utils/api')
  const originalReport = api.reportSubscribeMessageQuota
  api.reportSubscribeMessageQuota = payload => {
    reportedPayload = payload
    return Promise.resolve(true)
  }

  try {
    page.onSuccess(page.data.currentTier, true, false)
    await new Promise(resolve => setTimeout(resolve, 0))
  } finally {
    api.reportSubscribeMessageQuota = originalReport
  }

  assert.equal(reportedPayload.orderType, 'membership')
  assert.equal(reportedPayload.messageData.amount2.value, '0.00元')
  assert.equal(reportedPayload.messageData.thing1.value, '1个月会员')
  assert.match(reportedPayload.page, /^\/pages\/membership-success\/membership-success\?orderId=VIP/)
})

test('membership page includes a compact family learning promotional banner', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.wxml'),
    'utf8'
  )
  const style = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.wxss'),
    'utf8'
  )
  const source = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.js'),
    'utf8'
  )
  const imagePath = path.join(projectRoot, 'images/vip/membership-family-hero-v2.jpg')

  assert.ok(fs.existsSync(imagePath))
  assert.match(template, /class="promo-hero"/)
  assert.match(template, /src="{{membershipHeroImage}}"/)
  assert.match(source, /membershipHeroImage:\s*imageUrl\('\/images\/vip\/membership-family-hero-v2\.jpg'\)/)
  assert.match(template, /mode="widthFix"/)
  assert.match(style, /\.promo-hero-image\s*{[^}]*width:\s*100%/s)
})

test('membership section headings use one consistent badge system', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.wxml'),
    'utf8'
  )

  const badges = template.match(/class="section-mark section-mark-[^"]+"/g) || []
  assert.equal(badges.length, 6)
  assert.doesNotMatch(template, /section-title-icon/)
})

test('membership header and purchase actions reflect active membership state', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.wxml'),
    'utf8'
  )
  const script = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.js'),
    'utf8'
  )

  assert.match(
    template,
    /membership\.active \? vipBadgeActiveImage : vipBadgeInactiveImage/
  )
  assert.match(template, /membership\.active \? '续费延期' : '开通'/)
  assert.match(template, /membership\.active \? '确认续费' : '确认开通'/)
  assert.match(template, /延长会员有效期/)
  assert.match(script, /const renewing = this\.data\.membership\.active/)
  assert.match(script, /renewing \? '续费成功'/)
})

test('membership status copy and footer action stay on one line with compact spacing', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.wxml'),
    'utf8'
  )
  const style = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.wxss'),
    'utf8'
  )

  assert.match(template, /<text class="member-sub">\{\{membership\.active/)
  assert.match(template, /<text class="footer-action-label">\{\{redeemApplied/)
  assert.match(style, /\.member-copy\s*{[^}]*gap:\s*4rpx/s)
  assert.match(style, /\.footer-open\s*{[^}]*flex-wrap:\s*nowrap/s)
  assert.match(style, /\.footer-action-label\s*{[^}]*white-space:\s*nowrap/s)
})

test('membership audit mode shows only service rights posters', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.wxml'),
    'utf8'
  )
  const script = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.js'),
    'utf8'
  )
  const style = fs.readFileSync(
    path.join(projectRoot, 'pages/membership/membership.wxss'),
    'utf8'
  )

  assert.match(template, /auditMode \? '产品介绍'/)
  assert.match(template, /wx:if="\{\{auditMode\}\}" class="audit-poster-list"/)
  assert.match(template, /wx:for="\{\{auditPosterImages\}\}"/)
  assert.match(template, /wx:else class="member-content"/)
  assert.match(template, /wx:if="\{\{!auditMode\}\}" class="footer"/)
  assert.match(script, /'\/images\/vip\/service-rights-word-sentence\.png'/)
  assert.match(script, /'\/images\/vip\/service-rights-online-user\.png'/)
  assert.match(script, /'\/images\/vip\/service-rights-ten-minutes\.png'/)
  assert.match(style, /\.audit-poster-image\s*{[^}]*width:\s*100%/s)
})

test('membership records page reflects active membership state in profile badge', () => {
  const template = fs.readFileSync(
    path.join(projectRoot, 'pages/membership-records/membership-records.wxml'),
    'utf8'
  )
  const script = fs.readFileSync(
    path.join(projectRoot, 'pages/membership-records/membership-records.js'),
    'utf8'
  )
  const emptyImage = path.join(projectRoot, 'images/vip/membership-records-empty.png')

  assert.ok(fs.existsSync(emptyImage))
  assert.match(
    template,
    /membership\.active \? vipBadgeActiveImage : vipBadgeInactiveImage/
  )
  assert.match(script, /vipBadgeInactiveImage:\s*imageUrl\('\/images\/home\/vip-name-badge-inactive\.png'\)/)
  assert.match(script, /emptyStateImage:\s*imageUrl\('\/images\/vip\/membership-records-empty\.png'\)/)
  assert.match(template, /src="\{\{emptyStateImage\}\}"/)
})
