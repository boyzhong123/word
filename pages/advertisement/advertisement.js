// pages/advertisement/advertisement.js
const {
  refreshHomePage
} = require('../../utils/util')
const { isDevPurchased } = require('../../utils/dev-books')
const { IMAGE_BASE_URL } = require('../../utils/image-host')
const { getFallbackBookCover, normalizeBookCover } = require('../../utils/book-cover')

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

const VALIDITY_OPTIONS = [
  {
    id: '6m',
    name: '6个月',
    summary: '适合短期备考或试学'
  },
  {
    id: 'forever',
    name: '永久有效',
    tag: '推荐',
    summary: '一次购买，长期使用'
  }
]

const PACKAGE_OPTIONS = [
  {
    id: 'full',
    name: '词典+智能学习卡',
    tag: '推荐',
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
    name: '仅词典',
    tag: '',
    summary: '仅含词典内容，适合查阅与自主背诵',
    items: [
      '电子词典全部词汇与谚语',
      '单词释义、例句与发音示范',
      '谚语查阅与朗读音频',
      '不含智能学习卡与复习计划'
    ]
  }
]

const SKU_PRICES = {
  'book-6m': 29,
  'book-forever': 48,
  'full-6m': 68,
  'full-forever': 98
}

const MIN_PRICE = Object.keys(SKU_PRICES).reduce((min, key) => Math.min(min, SKU_PRICES[key]), Infinity)
const SKU_COUNT = Object.keys(SKU_PRICES).length
const DEFAULT_BOOK_COVER = getFallbackBookCover()
const DEFAULT_GRADE_TAGS = ['初中']
const FEATURE_CARDS = [
  {
    mark: '词',
    title: '词汇同步',
    desc: '围绕教材词表拆分学习任务'
  },
  {
    mark: '句',
    title: '句子积累',
    desc: '把短句、谚语和表达放进同一套练习'
  },
  {
    mark: '读',
    title: '跟读测评',
    desc: '读音反馈帮助孩子及时修正'
  },
  {
    mark: '练',
    title: '复习追踪',
    desc: '按进度安排复习和报告'
  }
]
const METHOD_STEPS = [
  { title: '先学词', desc: '按单元推进词义、发音和例句' },
  { title: '再练句', desc: '用短句和谚语串起真实表达' },
  { title: '持续复习', desc: '把错题、跟读和小测合并回顾' }
]
const COMPARE_PLANS = [
  {
    id: 'book',
    name: '仅词典',
    priceFrom: Math.min(SKU_PRICES['book-6m'], SKU_PRICES['book-forever'])
  },
  {
    id: 'full',
    name: '词典+智能学习卡',
    tag: '推荐',
    highlight: true,
    priceFrom: Math.min(SKU_PRICES['full-6m'], SKU_PRICES['full-forever'])
  }
]
const COMPARE_ROWS = [
  { label: '全部词汇与谚语词典', cells: [true, true] },
  { label: '释义 · 例句 · 发音示范', cells: [true, true] },
  { label: '谚语查阅与朗读音频', cells: [true, true] },
  { label: '智能学习卡（新学/跟读/测验）', cells: [false, true] },
  { label: '记忆曲线科学复习', cells: [false, true] },
  { label: '朗读评分与即时纠音', cells: [false, true] },
  { label: '打卡激励与进度追踪', cells: [false, true] }
]

function formatCount(value) {
  return String(Number(value) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function splitTags(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean)
  }
  if (value == null || value === '') {
    return []
  }
  return String(value)
    .split(/[、,，/|;\s]+/)
    .map(item => item.trim())
    .filter(Boolean)
}

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
  return PACKAGE_OPTIONS.find(item => item.id === packageId) || PACKAGE_OPTIONS[0]
}

function getValidityById(validityId) {
  return VALIDITY_OPTIONS.find(item => item.id === validityId) || VALIDITY_OPTIONS[0]
}

function getSkuPrice(packageId, validityId) {
  return SKU_PRICES[packageId + '-' + validityId] || MIN_PRICE
}

function buildCurrentSku(packageId, validityId) {
  const currentPackage = getPackageById(packageId)
  const currentValidity = getValidityById(validityId)
  const price = getSkuPrice(currentPackage.id, currentValidity.id)
  return {
    packageId: currentPackage.id,
    validityId: currentValidity.id,
    packageName: currentPackage.name,
    validityName: currentValidity.name,
    skuLabel: currentPackage.name + ' · ' + currentValidity.name,
    price,
    items: currentPackage.items
  }
}

function resolveUnlocked(options) {
  if (options.unlocked === '1') {
    return true
  }
  if (options.unlocked === '0') {
    return false
  }
  return isDevPurchased(decodeQueryValue(options.resBookId))
}

function applyBookDetail(page, book, unlocked) {
  const learningUnits = book.learningInfo && book.learningInfo.book
    ? book.learningInfo.book.learningUnits
    : 0
  const selectedPackage = page.data.selectedPackage || 'full'
  const selectedValidity = page.data.selectedValidity || 'forever'
  const currentSku = buildCurrentSku(selectedPackage, selectedValidity)
  const total = Number(book.total || learningUnits || 0)
  const wordCount = Number(book.wordCount || 0)
  const proverbCount = Number(book.proverbCount || 0)
  const totalText = formatCount(total)
  const wordCountText = formatCount(wordCount)
  const proverbCountText = formatCount(proverbCount)
  const gradeTags = splitTags(
    book.grades || book.grade || book.gradeTags || book.applyGrades || book.applicableGrades
  )
  const displayGradeTags = gradeTags.length ? gradeTags : DEFAULT_GRADE_TAGS
  const contentStats = [
    {
      value: wordCountText,
      unit: '个',
      label: '收录单词',
      iconKey: 'word'
    },
    {
      value: proverbCountText,
      unit: '条',
      label: '实用句子',
      iconKey: 'proverb'
    },
    {
      value: totalText,
      unit: '个',
      label: '学习单元',
      iconKey: 'review'
    }
  ]

  page.resBookId = book.resBookId || ''
  page.setData({
    name: book.name || '',
    bookCover: normalizeBookCover(book.bookCover || book.cover || DEFAULT_BOOK_COVER),
    total,
    wordCount,
    proverbCount,
    totalText,
    wordCountText,
    proverbCountText,
    press: book.press || '',
    gradeTags: displayGradeTags,
    bookSummary: wordCountText + ' 词 · ' + proverbCountText + ' 句 · ' + totalText + ' 单元',
    contentStats,
    featureCards: FEATURE_CARDS,
    methodSteps: METHOD_STEPS,
    intro: book.intro || '',
    unlocked: !!unlocked,
    packages: PACKAGE_OPTIONS,
    validityOptions: VALIDITY_OPTIONS,
    selectedValidity,
    currentSku,
    currentPackage: getPackageById(selectedPackage),
    currentPackageItems: currentSku.items,
    skuCount: SKU_COUNT
  })
}

Page({
  data: {
    imageBaseUrl: IMAGE_BASE_URL,
    name: '',
    bookCover: '',
    total: 0,
    wordCount: 0,
    proverbCount: 0,
    totalText: '0',
    wordCountText: '0',
    proverbCountText: '0',
    minPrice: MIN_PRICE,
    skuCount: SKU_COUNT,
    press: '',
    gradeTags: DEFAULT_GRADE_TAGS,
    bookSummary: '0 词 · 0 句 · 0 单元',
    contentStats: [],
    featureCards: FEATURE_CARDS,
    methodSteps: METHOD_STEPS,
    comparePlans: COMPARE_PLANS,
    compareRows: COMPARE_ROWS,
    intro: '',
    unlocked: false,
    skuSheetVisible: false,
    selectedPackage: 'full',
    selectedValidity: 'forever',
    packages: PACKAGE_OPTIONS,
    validityOptions: VALIDITY_OPTIONS,
    currentSku: buildCurrentSku('full', 'forever'),
    currentPackage: PACKAGE_OPTIONS[0],
    currentPackageItems: PACKAGE_OPTIONS[0].items,
    scrollHeight,
    safeAreaBottom,
    actionHeight: purchaseBarHeight
  },

  onLoad(options) {
    const app = getApp()
    const pendingBook = app.globalData.pendingBookDetail
    const resBookId = decodeQueryValue(options.resBookId)
    const unlocked = resolveUnlocked(options)
    const selectedPackage = decodeQueryValue(options.packageId) || 'full'
    const selectedValidity = decodeQueryValue(options.validityId) || 'forever'

    this.setData({
      selectedPackage: getPackageById(selectedPackage).id,
      selectedValidity: getValidityById(selectedValidity).id
    })

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
      grades: decodeQueryValue(options.grades || options.grade || options.gradeTags),
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

  onBookCoverError() {
    this.setData({ bookCover: getFallbackBookCover() })
  },

  updateSkuSelection(packageId, validityId) {
    const currentPackage = getPackageById(packageId)
    const currentValidity = getValidityById(validityId)
    const currentSku = buildCurrentSku(currentPackage.id, currentValidity.id)
    this.setData({
      selectedPackage: currentPackage.id,
      selectedValidity: currentValidity.id,
      currentPackage,
      currentSku,
      currentPackageItems: currentSku.items
    })
  },

  selectPackage(event) {
    this.updateSkuSelection(event.currentTarget.dataset.id, this.data.selectedValidity)
  },

  selectValidity(event) {
    this.updateSkuSelection(this.data.selectedPackage, event.currentTarget.dataset.id)
  },

  confirmPurchase() {
    this.setData({ skuSheetVisible: false })
    this.goVip()
  },

  goVip() {
    const currentSku = buildCurrentSku(this.data.selectedPackage, this.data.selectedValidity)
    wx.navigateTo({
      url: '../vip/vip?resBookId=' + encodeURIComponent(this.resBookId || '')
        + '&name=' + encodeURIComponent(this.data.name || '')
        + '&bookCover=' + encodeURIComponent(this.data.bookCover || '')
        + '&press=' + encodeURIComponent(this.data.press || '')
        + '&packageId=' + encodeURIComponent(currentSku.packageId)
        + '&packageName=' + encodeURIComponent(currentSku.packageName)
        + '&validityId=' + encodeURIComponent(currentSku.validityId)
        + '&validityName=' + encodeURIComponent(currentSku.validityName)
        + '&price=' + encodeURIComponent(currentSku.price || 0),
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
      grades: this.data.gradeTags.join(','),
      intro: this.data.intro,
      resBookId: this.resBookId,
      unlocked: this.data.unlocked ? '1' : '0',
      packageId: this.data.selectedPackage,
      validityId: this.data.selectedValidity
    }

    return {
      path: '/pages/advertisement/advertisement?' + Object.keys(query)
        .map((key) => key + '=' + encodeQueryValue(query[key]))
        .join('&')
    }
  }
})
