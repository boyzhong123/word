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
    getStorageSync: () => null
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
})

test('membership page opens the sku confirmation when requested by an entry point', () => {
  const page = loadMembershipPage({ tierId: 'm2', openSku: '1' })

  assert.equal(page.data.selectedTierId, 'm2')
  assert.equal(page.data.showConfirm, true)
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
