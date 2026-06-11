// 错词复习的「假数据」。等后端提供按 reviewUnitIds / 用户维度返回错词的接口后，
// 用真实请求替换 buildMockReviewResource 即可，practice / listen 页消费的数据结构
// 与 getUnitResource 保持一致，因此替换时无需改动页面逻辑。
const MOCK_REVIEW_WORDS = [
  {
    content: 'apple',
    symbol: 'ˈæpl',
    attribute: 'n.',
    translation: '苹果',
    exchange: 'apples',
    sentence: 'There is an apple on the table.',
    sentenceCn: '桌子上有一个苹果。',
    senses: [
      { pos: 'n.', terms: ['苹果', '苹果树'] }
    ],
    phrases: [
      { en: 'an apple tree', cn: '一棵苹果树' },
      { en: 'apple juice', cn: '苹果汁' },
      { en: 'the apple of one\'s eye', cn: '掌上明珠' }
    ],
    examTexts: [
      { en: 'There is an apple on the table.', cn: '桌子上有一个苹果。', source: '2021·江苏南京·完形填空' },
      { en: 'My mother buys three apples from the market.', cn: '我妈妈从市场买了三个苹果。', source: '2019·浙江杭州·阅读' }
    ],
    synonyms: [
      { pos: 'n.', en: 'fruit', cn: '水果（泛指所有水果）' }
    ],
    mnemonic: 'a（一个）+ pple（像苹果的形状）→ 一个苹果',
    etymology: 'apple 源自古英语 \'æppel\'，与古高地德语 \'apful\' 同源，词根无特定拆分，同源词有 pineapple（菠萝，字面 “松果”）',
    pronunciationTips: [
      '先发 /æ/ 音，嘴巴张大，舌尖抵下齿背',
      '接着发 /p/ 音，双唇紧闭后突然张开送气',
      '最后发 /l/ 音，舌尖抵住上齿龈，气流从舌头两侧流出'
    ]
  },
  {
    content: 'banana',
    symbol: 'bəˈnɑːnə',
    attribute: 'n.',
    translation: '香蕉',
    sentence: 'The monkey likes to eat a banana.',
    sentenceCn: '猴子喜欢吃香蕉。'
  },
  {
    content: 'orange',
    symbol: 'ˈɒrɪndʒ',
    attribute: 'n.',
    translation: '橙子',
    sentence: 'She drinks orange juice at breakfast.',
    sentenceCn: '她早餐喝橙汁。'
  },
  {
    content: 'tiger',
    symbol: 'ˈtaɪɡə',
    attribute: 'n.',
    translation: '老虎',
    sentence: 'A tiger is a very strong animal.',
    sentenceCn: '老虎是非常强壮的动物。'
  },
  {
    content: 'school',
    symbol: 'skuːl',
    attribute: 'n.',
    translation: '学校',
    sentence: 'We go to school five days a week.',
    sentenceCn: '我们一周上五天学。'
  },
  {
    content: 'friend',
    symbol: 'frend',
    attribute: 'n.',
    translation: '朋友',
    sentence: 'My best friend is always kind to me.',
    sentenceCn: '我最好的朋友总是对我很好。'
  }
]

// 返回与 getUnitResource 相同结构的数组（每个元素含 word / proverb / unit / needVip）。
function buildMockReviewResource(reviewUnitIds) {
  const ids = Array.isArray(reviewUnitIds) ? reviewUnitIds.filter(Boolean) : []
  const baseUnitId = ids[0] || 'review'
  const total = MOCK_REVIEW_WORDS.length

  return MOCK_REVIEW_WORDS.map((item, index) => ({
    needVip: 0,
    isReview: true,
    unit: {
      unitId: baseUnitId,
      sort: 0,
      unitName: '错词复习',
      wordTotal: total
    },
    word: {
      sort: index + 1,
      content: item.content,
      symbol: item.symbol,
      attribute: item.attribute,
      translation: item.translation,
      audio: '',
      pages: [],
      exchange: item.exchange || item.content,
      // 详情页可选区块：后端补齐对应字段后即可自动展示
      senses: item.senses || null,
      phrases: item.phrases || null,
      examTexts: item.examTexts || null,
      synonyms: item.synonyms || null,
      mnemonic: item.mnemonic || '',
      etymology: item.etymology || '',
      pronunciationTips: item.pronunciationTips || null
    },
    proverb: [
      {
        content: item.sentence,
        translation: item.sentenceCn,
        audio: '',
        translationAudio: ''
      }
    ]
  }))
}

module.exports = {
  MOCK_REVIEW_WORDS,
  buildMockReviewResource
}
