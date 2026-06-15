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

test('advertisement detail exposes validity and package sku selectors', () => {
  assert.match(adTemplate, /词典有效期/)
  assert.match(adTemplate, /validityOptions/)
  assert.match(adTemplate, /selectValidity/)
  assert.match(adTemplate, /sku-group-label">套餐/)
  assert.match(adTemplate, /selectPackage/)
  assert.match(adScript, /name: '6个月'/)
  assert.match(adScript, /name: '永久有效'/)
  assert.match(adScript, /name: '仅词典'/)
  assert.match(adScript, /name: '词典\+智能学习卡'/)
  assert.match(adScript, /VALIDITY_OPTIONS/)
  assert.match(adScript, /SKU_PRICES/)
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

test('advertisement sku price updates when validity and package change', () => {
  const page = loadAdvertisementPage({
    resBookId: 'book-2',
    name: 'Locked Book',
    unlocked: '0'
  })

  page.selectPackage({ currentTarget: { dataset: { id: 'book' } } })
  page.selectValidity({ currentTarget: { dataset: { id: '6m' } } })

  assert.equal(page.data.selectedPackage, 'book')
  assert.equal(page.data.selectedValidity, '6m')
  assert.equal(page.data.currentSku.price, 29)
  assert.equal(page.data.currentSku.skuLabel, '仅词典 · 6个月')
})

test('mock textbooks are locked so catalog items can preview purchase flow', () => {
  assert.match(mockTextbooks, /needVip:\s*1/)
})
