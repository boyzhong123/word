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

const MIN_PRICE = PACKAGES.reduce((min, item) => Math.min(min, item.price), Infinity)
const DEFAULT_BOOK_COVER = '/images/home/book-cover.png'
const DEFAULT_GRADE_TAGS = ['初中']
const FEATURE_CARDS = [
  {
    icon: '/images/home/ad/icon-word-jelly.png',
    title: '词汇同步',
    desc: '围绕教材词表拆分学习任务'
  },
  {
    icon: '/images/home/ad/icon-proverb-jelly.png',
    title: '句子积累',
    desc: '把短句、谚语和表达放进同一套练习'
  },
  {
    icon: '/images/home/ad/icon-read-jelly.png',
    title: '跟读测评',
    desc: '读音反馈帮助孩子及时修正'
  },
  {
    icon: '/images/home/ad/icon-review-jelly.png',
    title: '复习追踪',
    desc: '按进度安排复习和报告'
  }
]
const METHOD_STEPS = [
  { title: '先学词', desc: '按单元推进词义、发音和例句' },
  { title: '再练句', desc: '用短句和谚语串起真实表达' },
  { title: '持续复习', desc: '把错题、跟读和小测合并回顾' }
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
  return PACKAGES.find(item => item.id === packageId) || PACKAGES[0]
}

function applyBookDetail(page, book, unlocked) {
  const learningUnits = book.learningInfo && book.learningInfo.book
    ? book.learningInfo.book.learningUnits
    : 0
  const selectedPackage = page.data.selectedPackage || 'full'
  const currentPackage = getPackageById(selectedPackage)
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
      icon: '/images/home/ad/icon-word-jelly.png',
      value: wordCountText,
      unit: '个',
      label: '收录单词'
    },
    {
      icon: '/images/home/ad/icon-proverb-jelly.png',
      value: proverbCountText,
      unit: '条',
      label: '实用句子'
    },
    {
      icon: '/images/home/ad/icon-review-jelly.png',
      value: totalText,
      unit: '期',
      label: '学习单元'
    }
  ]

  page.resBookId = book.resBookId || ''
  page.setData({
    name: book.name || '',
    bookCover: book.bookCover || DEFAULT_BOOK_COVER,
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
    totalText: '0',
    wordCountText: '0',
    proverbCountText: '0',
    minPrice: MIN_PRICE,
    press: '',
    gradeTags: DEFAULT_GRADE_TAGS,
    bookSummary: '0 词 · 0 句 · 0 单元',
    contentStats: [],
    featureCards: FEATURE_CARDS,
    methodSteps: METHOD_STEPS,
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
      grades: this.data.gradeTags.join(','),
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
