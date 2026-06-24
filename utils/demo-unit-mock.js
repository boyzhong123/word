// 开发 / 体验环境：任意教材统一使用这套演示关卡与词表，不依赖后端 book-units。
// 已关闭：改为按用户选择的图书加载真实关卡（仍保留 FALLBACK_UNITS 作为兜底）。
// 如需重新启用整套演示词表，将 ENABLE_DEMO_UNITS 置回 true 即可。
const ENABLE_DEMO_UNITS = false
const { buildVoiceUrl } = require('./voice-url')
const DEMO_UNIT_PREFIX = 'demo-unit-'

const DEMO_UNIT_WORDS = {
  1: [
    { content: 'apple', symbol: 'ˈæpl', attribute: 'n.', translation: '苹果', sentence: 'There is an apple on the table.', sentenceCn: '桌子上有一个苹果。' },
    { content: 'banana', symbol: 'bəˈnɑːnə', attribute: 'n.', translation: '香蕉', sentence: 'The monkey likes to eat a banana.', sentenceCn: '猴子喜欢吃香蕉。' },
    { content: 'orange', symbol: 'ˈɒrɪndʒ', attribute: 'n.', translation: '橙子', sentence: 'She drinks orange juice at breakfast.', sentenceCn: '她早餐喝橙汁。' },
    { content: 'cat', symbol: 'kæt', attribute: 'n.', translation: '猫', sentence: 'The cat is sleeping on the sofa.', sentenceCn: '猫正在沙发上睡觉。' },
    { content: 'dog', symbol: 'dɒɡ', attribute: 'n.', translation: '狗', sentence: 'My dog runs in the park every day.', sentenceCn: '我的狗每天在公园里跑。' },
    { content: 'bird', symbol: 'bɜːd', attribute: 'n.', translation: '鸟', sentence: 'A little bird is singing in the tree.', sentenceCn: '一只小鸟在树上唱歌。' },
    { content: 'fish', symbol: 'fɪʃ', attribute: 'n.', translation: '鱼', sentence: 'We saw many fish in the river.', sentenceCn: '我们在河里看见很多鱼。' },
    { content: 'red', symbol: 'red', attribute: 'adj.', translation: '红色的', sentence: 'She wears a red dress today.', sentenceCn: '她今天穿了一条红裙子。' },
    { content: 'blue', symbol: 'bluː', attribute: 'adj.', translation: '蓝色的', sentence: 'The sky is blue and clear.', sentenceCn: '天空又蓝又晴朗。' },
    { content: 'big', symbol: 'bɪɡ', attribute: 'adj.', translation: '大的', sentence: 'They live in a big house.', sentenceCn: '他们住在一所大房子里。' },
    { content: 'small', symbol: 'smɔːl', attribute: 'adj.', translation: '小的', sentence: 'It is a small but lovely garden.', sentenceCn: '这是一个小而可爱的花园。' },
    { content: 'happy', symbol: 'ˈhæpi', attribute: 'adj.', translation: '开心的', sentence: 'The children look very happy today.', sentenceCn: '孩子们今天看起来很开心。' }
  ],
  2: [
    { content: 'school', symbol: 'skuːl', attribute: 'n.', translation: '学校', sentence: 'We go to school five days a week.', sentenceCn: '我们一周上五天学。' },
    { content: 'friend', symbol: 'frend', attribute: 'n.', translation: '朋友', sentence: 'My best friend is always kind to me.', sentenceCn: '我最好的朋友总是对我很好。' },
    { content: 'teacher', symbol: 'ˈtiːtʃə', attribute: 'n.', translation: '老师', sentence: 'Our English teacher is very patient.', sentenceCn: '我们的英语老师很有耐心。' },
    { content: 'student', symbol: 'ˈstjuːdnt', attribute: 'n.', translation: '学生', sentence: 'Every student should listen carefully.', sentenceCn: '每个学生都应该认真听讲。' },
    { content: 'book', symbol: 'bʊk', attribute: 'n.', translation: '书', sentence: 'I read an interesting book last night.', sentenceCn: '我昨晚读了一本有趣的书。' },
    { content: 'pen', symbol: 'pen', attribute: 'n.', translation: '钢笔', sentence: 'Please write your name with a pen.', sentenceCn: '请用钢笔写下你的名字。' },
    { content: 'desk', symbol: 'desk', attribute: 'n.', translation: '课桌', sentence: 'There is a lamp on my desk.', sentenceCn: '我的课桌上有一盏台灯。' },
    { content: 'chair', symbol: 'tʃeə', attribute: 'n.', translation: '椅子', sentence: 'Please take a chair and sit down.', sentenceCn: '请拿把椅子坐下。' },
    { content: 'read', symbol: 'riːd', attribute: 'v.', translation: '阅读', sentence: 'I like to read stories before bed.', sentenceCn: '我喜欢睡前读故事。' },
    { content: 'write', symbol: 'raɪt', attribute: 'v.', translation: '写', sentence: 'Please write the words three times.', sentenceCn: '请把这些单词写三遍。' },
    { content: 'study', symbol: 'ˈstʌdi', attribute: 'v.', translation: '学习', sentence: 'We study English every morning.', sentenceCn: '我们每天早上学英语。' },
    { content: 'learn', symbol: 'lɜːn', attribute: 'v.', translation: '学会', sentence: 'Children learn quickly through games.', sentenceCn: '孩子们通过游戏学得很快。' }
  ],
  3: [
    { content: 'water', symbol: 'ˈwɔːtə', attribute: 'n.', translation: '水', sentence: 'Drink more water every day.', sentenceCn: '每天要多喝水。' },
    { content: 'milk', symbol: 'mɪlk', attribute: 'n.', translation: '牛奶', sentence: 'He drinks a glass of milk at night.', sentenceCn: '他晚上喝一杯牛奶。' },
    { content: 'bread', symbol: 'bred', attribute: 'n.', translation: '面包', sentence: 'We bought some fresh bread.', sentenceCn: '我们买了一些新鲜面包。' },
    { content: 'rice', symbol: 'raɪs', attribute: 'n.', translation: '米饭', sentence: 'Rice is a common food in Asia.', sentenceCn: '米饭是亚洲常见的食物。' },
    { content: 'egg', symbol: 'eɡ', attribute: 'n.', translation: '鸡蛋', sentence: 'She boiled an egg for breakfast.', sentenceCn: '她早餐煮了一个鸡蛋。' },
    { content: 'meat', symbol: 'miːt', attribute: 'n.', translation: '肉', sentence: 'They do not eat much meat.', sentenceCn: '他们不太吃肉。' },
    { content: 'fruit', symbol: 'fruːt', attribute: 'n.', translation: '水果', sentence: 'Fresh fruit is good for your health.', sentenceCn: '新鲜水果有益健康。' },
    { content: 'vegetable', symbol: 'ˈvedʒtəbl', attribute: 'n.', translation: '蔬菜', sentence: 'Eat more vegetables every day.', sentenceCn: '每天多吃蔬菜。' },
    { content: 'eat', symbol: 'iːt', attribute: 'v.', translation: '吃', sentence: 'Let us eat lunch together.', sentenceCn: '我们一起吃午饭吧。' },
    { content: 'drink', symbol: 'drɪŋk', attribute: 'v.', translation: '喝', sentence: 'Do not drink too much soda.', sentenceCn: '不要喝太多汽水。' },
    { content: 'cook', symbol: 'kʊk', attribute: 'v.', translation: '烹饪', sentence: 'My father likes to cook dinner.', sentenceCn: '我爸爸喜欢做晚饭。' },
    { content: 'hungry', symbol: 'ˈhʌŋɡri', attribute: 'adj.', translation: '饥饿的', sentence: 'I am hungry after school.', sentenceCn: '放学后我饿了。' }
  ]
}

function isDemoUnitsEnabled() {
  if (!ENABLE_DEMO_UNITS) {
    return false
  }
  try {
    return wx.getAccountInfoSync().miniProgram.envVersion !== 'release'
  } catch (error) {
    return false
  }
}

function parseDemoUnitSort(unitId) {
  const match = String(unitId || '').match(/^demo-unit-(\d+)$/)
  return match ? Number(match[1]) : 0
}

function isDemoUnitId(unitId) {
  return parseDemoUnitSort(unitId) > 0
}

function getDemoWordsForUnit(sort) {
  return DEMO_UNIT_WORDS[sort] || DEMO_UNIT_WORDS[1] || []
}

function buildDemoUnitResource(unitId) {
  const sort = parseDemoUnitSort(unitId) || 1
  const words = getDemoWordsForUnit(sort)
  const total = words.length

  return words.map((item, index) => ({
    needVip: 0,
    unit: {
      unitId,
      sort,
      unitName: '关卡 ' + sort,
      wordTotal: total
    },
    word: {
      sort: index + 1,
      content: item.content,
      symbol: item.symbol,
      attribute: item.attribute,
      translation: item.translation,
      audio: buildVoiceUrl(item.content),
      pages: [],
      exchange: item.content
    },
    proverb: [
      {
        content: item.sentence,
        translation: item.sentenceCn,
        audio: buildVoiceUrl(item.sentence),
        translationAudio: ''
      }
    ]
  }))
}

function buildDemoUnitsList() {
  return [
    { unitId: 'demo-unit-1', sort: 1, wordTotal: 12, completed: true },
    { unitId: 'demo-unit-2', sort: 2, wordTotal: 12, completed: false },
    { unitId: 'demo-unit-3', sort: 3, wordTotal: 12, completed: false, needVip: 1 }
  ]
}

function resolveDemoUnitResource(unitId) {
  const sort = parseDemoUnitSort(unitId) || 1
  return buildDemoUnitResource('demo-unit-' + sort)
}

module.exports = {
  DEMO_UNIT_PREFIX,
  isDemoUnitsEnabled,
  isDemoUnitId,
  buildDemoUnitResource,
  resolveDemoUnitResource,
  buildDemoUnitsList,
  getDemoWordsForUnit
}
