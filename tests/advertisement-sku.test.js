const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const adScript = fs.readFileSync(path.join(projectRoot, 'pages/advertisement/advertisement.js'), 'utf8')
const adTemplate = fs.readFileSync(path.join(projectRoot, 'pages/advertisement/advertisement.wxml'), 'utf8')
const mockTextbooks = fs.readFileSync(path.join(projectRoot, 'utils/mock-textbooks.js'), 'utf8')

function loadAdvertisementPage(options, preStorage) {
  let pageConfig
  const storage = Object.assign({}, preStorage || {})

  global.getApp = () => ({
    globalData: {
      pendingBookDetail: null
    }
  })
  global.wx = {
    getSystemInfoSync: () => ({
      windowHeight: 800,
      safeArea: { bottom: 780 }
    }),
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = value },
    getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }),
    navigateTo: () => {}
  }
  global.Page = config => {
    pageConfig = config
  }

  delete require.cache[require.resolve('../pages/advertisement/advertisement')]
  require('../pages/advertisement/advertisement')

  const page = Object.assign({}, pageConfig, {
    data: JSON.parse(JSON.stringify(pageConfig.data)),
    setData(update) {
      Object.assign(this.data, update)
    }
  })

  if (options) {
    page.onLoad(options)
  }
  return page
}

test('advertisement sku sheet exposes membership duration tiers', () => {
  assert.match(adTemplate, /选择会员时长/)
  assert.match(adTemplate, /membershipTiers/)
  assert.match(adTemplate, /selectTier/)
  assert.match(adTemplate, /立即开通/)
  assert.match(adScript, /MEMBERSHIP_TIERS/)
  assert.match(adScript, /selectTier/)
  assert.match(adScript, /\/pages\/vip\/vip/)
  assert.doesNotMatch(adTemplate, /词典有效期/)
  assert.doesNotMatch(adTemplate, /selectPackage/)
})

test('advertisement confirm purchase navigates to vip order page with selected tier', () => {
  let navigatedUrl = ''
  const page = loadAdvertisementPage({
    resBookId: 'book-2',
    name: 'Locked Book',
    unlocked: '0'
  })
  page.resBookId = 'book-2'
  page.data.name = '初中英语词汇格言谚语词典'
  page.data.currentTier = { id: 'm2', name: '2个月', price: 59 }
  global.wx.navigateTo = ({ url }) => { navigatedUrl = url }

  page.confirmPurchase()

  assert.match(navigatedUrl, /\/pages\/vip\/vip\?/)
  assert.match(navigatedUrl, /tierId=m2/)
  assert.match(navigatedUrl, /price=59/)
  assert.equal(page.data.skuSheetVisible, false)
})

test('advertisement respects unlocked=0 even when dev purchase storage exists', () => {
  const page = loadAdvertisementPage({
    resBookId: 'book-2',
    name: 'Locked Book',
    unlocked: '0'
  }, {
    devPurchasedBooks: ['book-2']
  })

  assert.equal(page.data.unlocked, false)
})

test('advertisement keeps owned state when unlocked=1 is passed', () => {
  const page = loadAdvertisementPage({
    resBookId: 'book-2',
    name: 'Owned Book',
    unlocked: '1'
  })

  assert.equal(page.data.unlocked, true)
})

test('advertisement sku price updates when membership tier changes', () => {
  const page = loadAdvertisementPage({
    resBookId: 'book-2',
    name: 'Locked Book',
    unlocked: '0'
  })

  page.selectTier({ currentTarget: { dataset: { id: 'm1' } } })

  assert.equal(page.data.selectedTierId, 'm1')
  assert.equal(page.data.currentTier.price, 39)
  assert.equal(page.data.currentTier.name, '1个月')
})

test('mock textbooks are locked so catalog items can preview purchase flow', () => {
  assert.match(mockTextbooks, /needVip:\s*1/)
})
