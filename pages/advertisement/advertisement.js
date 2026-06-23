// pages/advertisement/advertisement.js
const {
  refreshHomePage
} = require('../../utils/util')
const { isDevPurchased } = require('../../utils/dev-books')
const {
  MEMBERSHIP_TIERS,
  DEFAULT_TIER_ID,
  getTier
} = require('../../utils/membership')
const { IMAGE_BASE_URL, imageUrl } = require('../../utils/image-host')
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

// 商品详情长图（6 页营销详情，按页序排列，COS 下发）
const DETAIL_IMAGE_VERSION = '20260623-trim'
const DETAIL_IMAGES = [
  '/images/home/ad/detail/detail-01.jpg',
  '/images/home/ad/detail/detail-02.jpg',
  '/images/home/ad/detail/detail-03.jpg',
  '/images/home/ad/detail/detail-04.jpg',
  '/images/home/ad/detail/detail-05.jpg',
  '/images/home/ad/detail/detail-06.jpg'
].map((path) => path + '?v=' + DETAIL_IMAGE_VERSION)

// 宝贝评价（淘宝风：文字 + 买家秀，买家秀图复用仓库截图/场景图裁成方图）
const REVIEW_SUMMARY = {
  recent: '近 3 个月好评率高达 98.9%'
}

// 评价分类（标签筛选用，顺序即展示顺序；计数由 REVIEWS 自动统计）
const REVIEW_CATEGORIES = ['发音标准', '孩子爱学', '内容实用', '效果明显', '界面好看', '性价比高', '客服态度好']

const REVIEWS = [
  {
    name: '笑***妈',
    avatarText: '笑',
    avatarBg: 'linear-gradient(135deg,#4f8cff,#2f6bff)',
    rating: 5,
    date: '2026-06-18',
    spec: '终生+卡 · 词典+智能学习卡',
    tags: ['发音标准', '效果明显'],
    text: '孩子三年级，跟读评分太实用了，发音不准会逐音纠正，比我教得标准。坚持两周，明显愿意开口读了。',
    images: ['/images/home/ad/reviews/r-recite.png', '/images/home/ad/reviews/r-finish-today.png']
  },
  {
    name: 't***o',
    avatarText: 'T',
    avatarBg: 'linear-gradient(135deg,#43d39e,#1fb886)',
    rating: 5,
    date: '2026-06-15',
    spec: '终生版 · 小程序学习权益',
    tags: ['性价比高', '孩子爱学'],
    text: '冲着永久版买的，一次付费长期用很划算。每关学完都有评星和报告，孩子像闯关一样停不下来。',
    images: ['/images/home/ad/reviews/r-home-map.png', '/images/home/ad/reviews/r-finish-word.png']
  },
  {
    name: '海****8',
    avatarText: '海',
    avatarBg: 'linear-gradient(135deg,#ffb24d,#ff8a1c)',
    rating: 4,
    date: '2026-06-12',
    spec: '6个月版 · 小程序学习权益',
    tags: ['内容实用'],
    text: '内容跟教材同步，听力小测和单词新学的闭环设计不错。就是希望后面能多更新几个单元。',
    images: ['/images/home/ad/reviews/r-quiz.png']
  },
  {
    name: '安**麻麻',
    avatarText: '安',
    avatarBg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)',
    rating: 5,
    date: '2026-06-10',
    spec: '6个月+卡 · 小程序+纸质词卡',
    tags: ['效果明显', '孩子爱学'],
    text: '学习报告每天能看到进度和正确率，做家长心里有数。现在孩子自己会主动打卡，不用催了。',
    images: ['/images/home/ad/reviews/r-finish-today.png', '/images/home/ad/reviews/r-checkin.png']
  },
  {
    name: '默****读',
    avatarText: '默',
    avatarBg: 'linear-gradient(135deg,#ff7eb3,#ff5a9e)',
    rating: 5,
    date: '2026-06-08',
    spec: '终生+卡 · 小程序+纸质词卡',
    tags: ['内容实用', '孩子爱学'],
    text: '带卡版到了，纸质词卡扫码就能进对应内容，线上线下联动，仪式感很强，孩子特别喜欢。',
    images: ['/images/home/ad/reviews/r-loop.png']
  },
  {
    name: '一****夏',
    avatarText: '夏',
    avatarBg: 'linear-gradient(135deg,#2dd4bf,#14b8a6)',
    rating: 5,
    date: '2026-06-05',
    spec: '终生版 · 小程序学习权益',
    tags: ['发音标准', '内容实用'],
    text: '随身听零碎时间磨耳朵，上下学路上放着听。语音评测说是跟中高考同源，练口语更有底气了。',
    images: ['/images/home/ad/reviews/r-player.png', '/images/home/ad/reviews/r-word.png']
  },
  {
    name: '用户****77',
    avatarText: '7',
    avatarBg: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
    rating: 5,
    date: '2026-06-03',
    spec: '6个月版 · 小程序学习权益',
    tags: ['效果明显'],
    text: '以前单词背了就忘，这个 AI 记忆加反复练，记得住多了。这周报告掌握率到九十多，挺惊喜。',
    images: ['/images/home/ad/reviews/r-finish-recite.png']
  },
  {
    name: 'm****妈',
    avatarText: 'M',
    avatarBg: 'linear-gradient(135deg,#fb7185,#f43f5e)',
    rating: 5,
    date: '2026-05-30',
    spec: '终生版 · 小程序学习权益',
    tags: ['界面好看', '性价比高', '客服态度好'],
    text: '微信打开就能用，不用下载 App，客服也回得快。学习计划能按孩子节奏定，省心，已经推荐给同学家长了。',
    images: ['/images/home/ad/reviews/r-plan.png', '/images/home/ad/reviews/r-family.png']
  }
]

// 由 REVIEWS 自动统计分类计数，count=0 的分类不展示；首项「全部」
function buildReviewTags(reviews) {
  const counts = {}
  REVIEW_CATEGORIES.forEach((c) => { counts[c] = 0 })
  reviews.forEach((r) => {
    (r.tags || []).forEach((t) => {
      if (counts[t] != null) { counts[t] += 1 }
    })
  })
  const tags = [{ key: 'all', label: '全部', count: reviews.length }]
  REVIEW_CATEGORIES.forEach((c) => {
    if (counts[c] > 0) { tags.push({ key: c, label: c, count: counts[c] }) }
  })
  return tags
}

const REVIEW_TAGS = buildReviewTags(REVIEWS)
const REVIEW_COUNT = REVIEWS.length

const VIP_BENEFITS = [
  { icon: imageUrl('/images/home/icon-benefit-unlock.svg'), title: '全部关卡解锁', desc: '免费版仅开放第 1 关' },
  { icon: imageUrl('/images/home/icon-benefit-listen.svg'), title: '随身听全开', desc: '所有关卡音频随时磨耳朵' },
  { icon: imageUrl('/images/home/icon-benefit-report.svg'), title: '学习报告与复习', desc: '记忆曲线安排科学复习' },
  { icon: imageUrl('/images/home/icon-benefit-speaking.svg'), title: '跟读评分纠音', desc: '逐音反馈，发音更标准' }
]
const VIP_CARD_TITLE = '词句刷刷刷 VIP 会员'
const VIP_CARD_SUBTITLE = '开通后解锁全部词句关卡、随身听、AI 跟读纠音和学习报告等完整刷词刷句内容'
const VIP_CARD_STATS = [
  { value: '无限', unit: '', label: '词句刷刷' },
  { value: '全开', unit: '', label: '随身听' },
  { value: '逐音', unit: '', label: '纠音反馈' }
]
const HERO_BENEFIT_TAGS = ['词句全解锁', '学习报告', 'AI 跟读纠音']

const MIN_PRICE = MEMBERSHIP_TIERS.reduce((min, tier) => Math.min(min, tier.price), Infinity)
const SKU_COUNT = MEMBERSHIP_TIERS.length
const DEFAULT_BOOK_COVER = getFallbackBookCover()
const DEFAULT_GRADE_TAGS = []
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
    id: 'vip',
    name: 'VIP 会员',
    tag: '推荐',
    highlight: true,
    priceFrom: MIN_PRICE
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
  const selectedTierId = page.data.selectedTierId || DEFAULT_TIER_ID
  const currentTier = getTier(selectedTierId) || getTier(DEFAULT_TIER_ID)
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
    contentStats: VIP_CARD_STATS,
    featureCards: FEATURE_CARDS,
    methodSteps: METHOD_STEPS,
    intro: book.intro || '',
    unlocked: !!unlocked,
    membershipTiers: MEMBERSHIP_TIERS,
    selectedTierId: currentTier.id,
    currentTier,
    vipBenefits: VIP_BENEFITS,
    minPrice: MIN_PRICE,
    skuCount: SKU_COUNT
  })
}

Page({
  data: {
    imageBaseUrl: IMAGE_BASE_URL,
    vipFloatingUnlockUrl: imageUrl('/images/home/vip-floating-unlock.png'),
    vipCardTitle: VIP_CARD_TITLE,
    vipCardSubtitle: VIP_CARD_SUBTITLE,
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
    activeTab: 'detail',
    detailImages: DETAIL_IMAGES,
    reviewSummary: REVIEW_SUMMARY,
    reviewCount: REVIEW_COUNT,
    reviewTags: REVIEW_TAGS,
    activeReviewTag: 'all',
    reviews: REVIEWS,
    filteredReviews: REVIEWS,
    reviewsExpanded: false,
    featureCards: FEATURE_CARDS,
    methodSteps: METHOD_STEPS,
    comparePlans: COMPARE_PLANS,
    compareRows: COMPARE_ROWS,
    intro: '',
    unlocked: false,
    skuSheetVisible: false,
    membershipTiers: MEMBERSHIP_TIERS,
    selectedTierId: DEFAULT_TIER_ID,
    currentTier: getTier(DEFAULT_TIER_ID),
    vipBenefits: VIP_BENEFITS,
    heroBenefitTags: HERO_BENEFIT_TAGS,
    scrollHeight,
    safeAreaBottom,
    actionHeight: purchaseBarHeight
  },

  onLoad(options) {
    const app = getApp()
    const pendingBook = app.globalData.pendingBookDetail
    const resBookId = decodeQueryValue(options.resBookId)
    const unlocked = resolveUnlocked(options)
    const tierId = decodeQueryValue(options.tierId) || DEFAULT_TIER_ID
    const currentTier = getTier(tierId) || getTier(DEFAULT_TIER_ID)

    this.setData({
      selectedTierId: currentTier.id,
      currentTier
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

  switchTab(event) {
    const tab = event.currentTarget.dataset.tab
    if (tab && tab !== this.data.activeTab) {
      this.setData({ activeTab: tab })
    }
  },

  toggleReviews() {
    this.setData({ reviewsExpanded: !this.data.reviewsExpanded })
  },

  filterReviews(event) {
    const key = event.currentTarget.dataset.key
    if (!key || key === this.data.activeReviewTag) {
      return
    }
    const list = key === 'all' ? REVIEWS : REVIEWS.filter((r) => (r.tags || []).indexOf(key) > -1)
    this.setData({
      activeReviewTag: key,
      filteredReviews: list,
      reviewsExpanded: false
    })
  },

  previewReviewImage(event) {
    const { url, urls } = event.currentTarget.dataset
    const list = (urls || []).map((item) => IMAGE_BASE_URL + item)
    if (!list.length) {
      return
    }
    wx.previewImage({
      current: IMAGE_BASE_URL + url,
      urls: list
    })
  },

  openSkuSheet() {
    this.setData({ skuSheetVisible: true })
  },

  closeSkuSheet() {
    this.setData({ skuSheetVisible: false })
  },

  onBookCoverError() {
    this.setData({ bookCover: getFallbackBookCover() })
  },

  selectTier(event) {
    const tierId = event.currentTarget.dataset.id
    const tier = getTier(tierId)
    if (!tier) {
      return
    }
    this.setData({ selectedTierId: tierId, currentTier: tier })
  },

  // 选完时长后跳转确认订单页（可输入兑换码、完成支付）。
  confirmPurchase() {
    const tier = this.data.currentTier || getTier(DEFAULT_TIER_ID)
    this.setData({ skuSheetVisible: false })

    const query = {
      resBookId: this.resBookId || '',
      name: this.data.name,
      bookCover: this.data.bookCover,
      press: this.data.press,
      tierId: tier.id,
      price: tier.price
    }

    wx.navigateTo({
      url: '/pages/vip/vip?' + Object.keys(query)
        .filter((key) => query[key] != null && query[key] !== '')
        .map((key) => key + '=' + encodeQueryValue(query[key]))
        .join('&'),
      events: {
        vip: () => {
          this.setData({ unlocked: true })
          refreshHomePage()
          const channel = typeof this.getOpenerEventChannel === 'function'
            ? this.getOpenerEventChannel()
            : null
          if (channel && typeof channel.emit === 'function') {
            channel.emit('vip')
          }
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
      tierId: this.data.selectedTierId
    }

    return {
      path: '/pages/advertisement/advertisement?' + Object.keys(query)
        .map((key) => key + '=' + encodeQueryValue(query[key]))
        .join('&')
    }
  }
})
