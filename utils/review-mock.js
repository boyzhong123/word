// 错词复习的「假数据」。等后端提供按 reviewUnitIds / 用户维度返回错词的接口后，
// 用真实请求替换 buildMockReviewResource 即可，practice / listen 页消费的数据结构
// 与 getUnitResource 保持一致，因此替换时无需改动页面逻辑。
const MOCK_REVIEW_WORDS = [
  {
    content: 'apple',
    symbol: 'ˈæpl',
    attribute: 'n.',
    translation: '苹果',
    sentence: 'I eat an apple every morning.',
    sentenceCn: '我每天早上吃一个苹果。'
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
      exchange: item.content
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
