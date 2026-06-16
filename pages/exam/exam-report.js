// pages/exam/exam-report.js
// 测评报告：单词/句子正确率、题型分布、错题清单。
// 结业测额外展示与入门测的对比（提升幅度）。
const { getResult } = require('../../utils/exam-data')
const { imageUrl } = require('../../utils/image-host')

function gradeText(accuracy) {
  if (accuracy >= 90) return '优秀'
  if (accuracy >= 75) return '良好'
  if (accuracy >= 60) return '及格'
  return '待加强'
}

// 正确率分档：用于上色与状态文案
function toneColor(accuracy) {
  if (accuracy >= 80) return '#22c55e'
  if (accuracy >= 50) return '#f59e0b'
  return '#ef4444'
}

function tierText(accuracy) {
  if (accuracy >= 80) return '掌握'
  if (accuracy >= 50) return '较好'
  return '待练'
}

function encourageText(type, accuracy, delta) {
  if (type === 'exit') {
    if (delta > 0) return '相比入门测进步明显，继续保持！'
    if (delta === 0) return '水平保持稳定，挑战更高目标吧！'
    return '状态有波动，把错题再巩固一遍就好。'
  }
  if (accuracy >= 85) return '基础很扎实，按计划学习会更稳。'
  if (accuracy >= 60) return '已有不错的基础，正是提升的好时机。'
  return '别担心，这正是开始的地方，一起加油！'
}

function buildDelta(label, exitVal, entryVal) {
  const delta = exitVal - entryVal
  return {
    label: label,
    entry: entryVal,
    exit: exitVal,
    delta: delta,
    deltaText: (delta > 0 ? '+' : '') + delta,
    trend: delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat')
  }
}

Page({
  data: {
    type: 'entry',
    typeName: '',
    bookName: '',
    result: null,
    reportHeroSrc: imageUrl('/images/home/exam-report-header-v2.jpg'),
    grade: '',
    encourage: '',
    sections: [],
    byType: [],
    wrong: [],
    hasWrong: false,
    showCompare: false,
    compareReady: false,
    compares: []
  },

  onLoad(options) {
    options = options || {}
    const resBookId = options.resBookId || ''
    const type = options.type === 'exit' ? 'exit' : 'entry'
    const bookName = options.name ? decodeURIComponent(options.name) : ''

    const result = getResult(resBookId, type)
    if (!result) {
      wx.showToast({ title: '报告数据缺失', icon: 'none' })
      return
    }

    const sections = [
      { key: 'word', name: '单词', icon: '../../images/home/exam-report/icon-badge-word.png', accuracy: result.wordAccuracy, correct: result.wordCorrect, total: result.wordTotal, color: '#16a34a', tintBg: '#e9f8ef', statusText: tierText(result.wordAccuracy) },
      { key: 'sentence', name: '句子', icon: '../../images/home/exam-report/icon-badge-sentence.png', accuracy: result.sentenceAccuracy, correct: result.sentenceCorrect, total: result.sentenceTotal, color: '#f97316', tintBg: '#fff2e6', statusText: tierText(result.sentenceAccuracy) }
    ]

    // 题型掌握度：按正确率上色（掌握/较好/待练），让条形和圆点会说话
    const byType = (result.byType || []).map(function (t) {
      return Object.assign({}, t, {
        barColor: toneColor(t.accuracy),
        statusText: tierText(t.accuracy)
      })
    })

    // 结业测：和入门测对比
    let showCompare = false
    let compareReady = false
    let compares = []
    let delta = 0
    if (type === 'exit') {
      showCompare = true
      const entry = getResult(resBookId, 'entry')
      if (entry) {
        compareReady = true
        delta = result.accuracy - entry.accuracy
        compares = [
          buildDelta('总正确率', result.accuracy, entry.accuracy),
          buildDelta('单词', result.wordAccuracy, entry.wordAccuracy),
          buildDelta('句子', result.sentenceAccuracy, entry.sentenceAccuracy)
        ]
      }
    }

    this.setData({
      type: type,
      typeName: type === 'exit' ? '结业测报告' : '入门测报告',
      bookName: bookName,
      result: result,
      grade: gradeText(result.accuracy),
      encourage: encourageText(type, result.accuracy, delta),
      sections: sections,
      byType: byType,
      wrong: result.wrong,
      hasWrong: result.wrong.length > 0,
      showCompare: showCompare,
      compareReady: compareReady,
      compares: compares
    })
  },

  back() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/home/home' })
    }
  }
})
