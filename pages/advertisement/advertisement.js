// pages/advertisement/advertisement.js
const {
  refreshHomePage
} = require('../../utils/util')
const { isDevPurchased } = require('../../utils/dev-books')

const systemInfo = wx.getSystemInfoSync()
const safeArea = wx.getStorageSync('safeArea') || systemInfo.safeArea || {
  bottom: systemInfo.windowHeight
}
const safeAreaBottom = systemInfo.windowHeight - safeArea.bottom
const statusBarHeight = wx.getStorageSync('statusBarHeight') || 0
const navigationBarHeight = wx.getStorageSync('navigationBarHeight') || 0
const purchaseBarHeight = Math.round(62 + safeAreaBottom)
const scrollHeight = systemInfo.windowHeight - statusBarHeight - navigationBarHeight - purchaseBarHeight
const encodeQueryValue = (value) => encodeURIComponent(value == null ? '' : value)

const PACKAGES = [
  {
    id: 'full',
    name: '学习卡套餐',
    tag: '推荐',
    price: 98,
    summary: '词典 + 智能学习卡，听说读写测完整闭环',
    items: [
      '电子词典全部词汇与谚语',
      '智能学习卡：单词新学 / 跟读 / 测验',
      '记忆曲线安排科学复习',
      '朗读评分与即时纠音反馈',
      '打卡激励与学习进度追踪'
    ]
  },
  {
    id: 'book',
    name: '词典套餐',
    tag: '',
    price: 48,
    summary: '仅含词典内容，适合查阅与自主背诵',
    items: [
      '电子词典全部词汇与谚语',
      '单词释义、例句与发音示范',
      '谚语查阅与朗读音频',
      '不含智能学习卡与复习计划'
    ]
  }
]

const DETAIL_BANNERS = [
  { src: '/images/home/ad/detail-page.png', caption: '' }
]

function decodeQueryValue(value) {
  if (value == null || value === '') {
    return ''
  }
  try {
    return decodeURIComponent(String(value))
  } catch (error) {
    return String(value)
  }
}

function getPackageById(packageId) {
  return PACKAGES.find(item => item.id === packageId) || PACKAGES[0]
}

function applyBookDetail(page, book, unlocked) {
  const learningUnits = book.learningInfo && book.learningInfo.book
    ? book.learningInfo.book.learningUnits
    : 0
  const selectedPackage = page.data.selectedPackage || 'full'
  const currentPackage = getPackageById(selectedPackage)

  page.resBookId = book.resBookId || ''
  page.setData({
    name: book.name || '',
    bookCover: book.bookCover || '',
    total: Number(book.total || learningUnits || 0),
    wordCount: Number(book.wordCount || 0),
    proverbCount: Number(book.proverbCount || 0),
    press: book.press || '',
    intro: book.intro || '',
    unlocked: !!unlocked,
    packages: PACKAGES,
    detailBanners: DETAIL_BANNERS,
    currentPackage,
    currentPackageItems: currentPackage.items
  })
}

Page({
  data: {
    name: '',
    bookCover: '',
    total: 0,
    wordCount: 0,
    proverbCount: 0,
    press: '',
    intro: '',
    unlocked: false,
    skuSheetVisible: false,
    selectedPackage: 'full',
    packages: PACKAGES,
    detailBanners: DETAIL_BANNERS,
    currentPackage: PACKAGES[0],
    currentPackageItems: PACKAGES[0].items,
    scrollHeight,
    safeAreaBottom,
    actionHeight: purchaseBarHeight
  },

  onLoad(options) {
    const app = getApp()
    const pendingBook = app.globalData.pendingBookDetail
    const resBookId = decodeQueryValue(options.resBookId)
    const unlocked = options.unlocked === '1' || isDevPurchased(resBookId)
    const selectedPackage = decodeQueryValue(options.packageId) || 'full'

    this.setData({ selectedPackage: getPackageById(selectedPackage).id })

    if (pendingBook && pendingBook.resBookId === resBookId) {
      applyBookDetail(this, pendingBook, unlocked)
      app.globalData.pendingBookDetail = null
      return
    }

    applyBookDetail(this, {
      resBookId,
      name: decodeQueryValue(options.name),
      bookCover: decodeQueryValue(options.bookCover),
      total: options.total,
      wordCount: options.wordCount,
      proverbCount: options.proverbCount,
      press: decodeQueryValue(options.press),
      intro: decodeQueryValue(options.intro)
    }, unlocked)
  },

  noop() {},

  openSkuSheet() {
    this.setData({ skuSheetVisible: true })
  },

  closeSkuSheet() {
    this.setData({ skuSheetVisible: false })
  },

  selectPackage(event) {
    const packageId = event.currentTarget.dataset.id
    const currentPackage = getPackageById(packageId)
    this.setData({
      selectedPackage: currentPackage.id,
      currentPackage,
      currentPackageItems: currentPackage.items
    })
  },

  confirmPurchase() {
    this.setData({ skuSheetVisible: false })
    this.goVip()
  },

  goVip() {
    const currentPackage = getPackageById(this.data.selectedPackage)
    wx.navigateTo({
      url: '../vip/vip?resBookId=' + encodeURIComponent(this.resBookId || '')
        + '&name=' + encodeURIComponent(this.data.name || '')
        + '&bookCover=' + encodeURIComponent(this.data.bookCover || '')
        + '&press=' + encodeURIComponent(this.data.press || '')
        + '&packageId=' + encodeURIComponent(currentPackage.id)
        + '&packageName=' + encodeURIComponent(currentPackage.name)
        + '&price=' + encodeURIComponent(currentPackage.price || 0),
      events: {
        vip: () => {
          this.setData({ unlocked: true })
          refreshHomePage()
          wx.navigateBack()
        }
      }
    })
  },

  onShareAppMessage() {
    const query = {
      name: this.data.name,
      bookCover: this.data.bookCover,
      total: this.data.total,
      wordCount: this.data.wordCount,
      proverbCount: this.data.proverbCount,
      press: this.data.press,
      intro: this.data.intro,
      resBookId: this.resBookId,
      unlocked: this.data.unlocked ? '1' : '0',
      packageId: this.data.selectedPackage
    }

    return {
      path: '/pages/advertisement/advertisement?' + Object.keys(query)
        .map((key) => key + '=' + encodeQueryValue(query[key]))
        .join('&')
    }
  }
})
