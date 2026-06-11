// pages/report/report.js
// 关卡学习报告：复用首页「今日要学」的薄荷绿胶冻视觉语言。
// 目前后端尚无逐词成绩，先按关卡参数（sort / 词数 / 谚语）生成可预览的演示数据，
// 待真实接口接入后，把 buildReport 换成接口返回即可，页面结构保持不变。

// 演示用词库（校园 / 日常主题），带音标与释义。
const WORD_POOL = [
  { spell: 'apple', phonetic: '/ˈæp.l/', meaning: '苹果' },
  { spell: 'water', phonetic: '/ˈwɔː.tər/', meaning: '水' },
  { spell: 'pencil', phonetic: '/ˈpen.səl/', meaning: '铅笔' },
  { spell: 'school', phonetic: '/skuːl/', meaning: '学校' },
  { spell: 'friend', phonetic: '/frend/', meaning: '朋友' },
  { spell: 'happy', phonetic: '/ˈhæp.i/', meaning: '快乐的' },
  { spell: 'orange', phonetic: '/ˈɒr.ɪndʒ/', meaning: '橙子' },
  { spell: 'teacher', phonetic: '/ˈtiː.tʃər/', meaning: '老师' },
  { spell: 'window', phonetic: '/ˈwɪn.dəʊ/', meaning: '窗户' },
  { spell: 'yellow', phonetic: '/ˈjel.əʊ/', meaning: '黄色的' },
  { spell: 'garden', phonetic: '/ˈɡɑː.dən/', meaning: '花园' },
  { spell: 'animal', phonetic: '/ˈæn.ɪ.məl/', meaning: '动物' },
  { spell: 'basket', phonetic: '/ˈbɑː.skɪt/', meaning: '篮子' },
  { spell: 'sister', phonetic: '/ˈsɪs.tər/', meaning: '姐妹' },
  { spell: 'summer', phonetic: '/ˈsʌm.ər/', meaning: '夏天' },
  { spell: 'pocket', phonetic: '/ˈpɒk.ɪt/', meaning: '口袋' },
  { spell: 'rabbit', phonetic: '/ˈræb.ɪt/', meaning: '兔子' },
  { spell: 'candle', phonetic: '/ˈkæn.dəl/', meaning: '蜡烛' },
  { spell: 'bottle', phonetic: '/ˈbɒt.əl/', meaning: '瓶子' },
  { spell: 'flower', phonetic: '/ˈflaʊ.ər/', meaning: '花朵' },
  { spell: 'monkey', phonetic: '/ˈmʌŋ.ki/', meaning: '猴子' },
  { spell: 'pillow', phonetic: '/ˈpɪl.əʊ/', meaning: '枕头' },
  { spell: 'ticket', phonetic: '/ˈtɪk.ɪt/', meaning: '票' },
  { spell: 'button', phonetic: '/ˈbʌt.ən/', meaning: '纽扣' }
]

function toPositiveInt(value, fallback) {
  const num = parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function starsForAccuracy(accuracy) {
  let filled = 1
  if (accuracy >= 90) {
    filled = 3
  } else if (accuracy >= 75) {
    filled = 2
  }
  return [filled >= 1, filled >= 2, filled >= 3]
}

// 由关卡参数生成一份稳定的演示报告（同一关卡每次进入数据一致）。
function buildReport(sort, total, enSaying, zhSaying) {
  const safeTotal = clamp(total || 12, 1, WORD_POOL.length)

  // 取词：按 sort 给一个稳定偏移，让不同关卡的词不同。
  const offset = ((sort - 1) * 7) % WORD_POOL.length
  const picked = []
  for (let i = 0; i < safeTotal; i++) {
    picked.push(WORD_POOL[(offset + i) % WORD_POOL.length])
  }

  // 错词数量：随词数轻微浮动，至少 1、最多 1/4。
  const wrongCount = clamp(
    Math.round(safeTotal * (sort % 2 === 0 ? 0.15 : 0.08)),
    safeTotal >= 8 ? 1 : 0,
    Math.floor(safeTotal / 4) || 1
  )

  // 错词落点：在列表里均匀散开，保证稳定。
  const wrongSet = {}
  if (wrongCount > 0) {
    const step = Math.max(1, Math.floor(safeTotal / wrongCount))
    for (let i = 0; i < wrongCount; i++) {
      wrongSet[(2 + i * step) % safeTotal] = true
    }
  }

  const mastered = []
  const review = []
  picked.forEach((word, index) => {
    if (wrongSet[index]) {
      review.push(Object.assign({}, word, {
        status: 'review',
        rate: 50 + ((index * 7) % 25) // 50% ~ 74%
      }))
    } else {
      mastered.push(Object.assign({}, word, {
        status: 'mastered',
        rate: 90 + ((index * 3) % 11) // 90% ~ 100%
      }))
    }
  })

  const masteredCount = mastered.length
  const accuracy = Math.round((masteredCount / safeTotal) * 100)
  const minutes = clamp(Math.round(safeTotal * 0.7), 4, 30)
  const stageStars = starsForAccuracy(accuracy)

  // 三个环节得分：围绕总正确率做稳定微调。
  const taskStats = [
    {
      type: 'word',
      label: '单词新学',
      icon: '../../images/home/task-word.png',
      iconBg: '#dcfce7',
      color: '#16a34a',
      score: clamp(accuracy + 3, 60, 100),
      caption: masteredCount + '/' + safeTotal + ' 词掌握'
    },
    {
      type: 'recitation',
      label: '跟读背诵',
      icon: '../../images/home/task-recitation.png',
      iconBg: '#ffedd5',
      color: '#f97316',
      score: clamp(accuracy - 4 + (sort % 3), 60, 99),
      caption: '发音流利度'
    },
    {
      type: 'listening',
      label: '听力小测',
      icon: '../../images/home/task-listening.png',
      iconBg: '#ededf0',
      color: '#111318',
      score: clamp(accuracy + 1 - (sort % 2), 60, 100),
      caption: '听音辨义'
    }
  ]

  // 鼓励语随正确率变化。
  let encourage = '稳扎稳打，继续加油！'
  if (accuracy >= 95) {
    encourage = '近乎满分，太棒啦！'
  } else if (accuracy >= 85) {
    encourage = '表现很棒，再巩固一下错词就更稳了。'
  } else if (review.length > 0) {
    encourage = '把 ' + review.length + ' 个错词再练一练，正确率还能往上冲。'
  }

  return {
    title: '关卡 ' + sort + ' · ' + safeTotal + '词',
    enSaying: enSaying || '',
    zhSaying: zhSaying || '',
    showSaying: !!(enSaying || zhSaying),
    accuracy,
    masteredCount,
    wrongCount: review.length,
    minutes,
    stageStars,
    taskStats,
    masteredWords: mastered,
    reviewWords: review,
    hasReviewWords: review.length > 0,
    encourage
  }
}

Page({
  data: {
    report: null
  },

  onLoad(options) {
    const sort = toPositiveInt(options.sort, 1)
    const total = toPositiveInt(options.words, 12)
    const enSaying = options.en ? decodeURIComponent(options.en) : ''
    const zhSaying = options.zh ? decodeURIComponent(options.zh) : ''

    this.setData({
      report: buildReport(sort, total, enSaying, zhSaying)
    })
  },

  back() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/home/home' })
    }
  },

  // 复习错词：跳回练习页对应关卡（暂未接入，先提示）。
  reviewWrongWords() {
    if (!this.data.report || !this.data.report.hasReviewWords) {
      return
    }
    wx.showToast({ title: '错词复习马上上线', icon: 'none' })
  },

  noop() {}
})
