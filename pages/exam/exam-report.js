// pages/exam/exam-report.js
// 测评报告：单词/句子正确率、题型分布、错题清单。
// 结业测额外展示与入门测的对比（提升幅度）。
const { getResult } = require('../../utils/exam-data')
const { imageUrl } = require('../../utils/image-host')
const { gradeText, tierText, toneColor, encourageText } = require('../../utils/exam-report-copy')

function formatPracticeTime(seconds, estimated) {
  seconds = Math.round(Number(seconds) || 0)
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return ''
  }
  return (estimated ? '约' : '') + Math.max(1, Math.ceil(seconds / 60)) + '分'
}

function formatPracticeDateTime(ts) {
  ts = Number(ts)
  if (!Number.isFinite(ts) || ts <= 0) {
    return ''
  }
  var d = new Date(ts)
  var month = d.getMonth() + 1
  var day = d.getDate()
  var hour = d.getHours()
  var minute = d.getMinutes()
  return month + '月' + day + '日 ' + hour + ':' + (minute < 10 ? '0' : '') + minute
}

function fallbackPracticeTimeText(result) {
  if (!result) {
    return ''
  }
  if (result.practiceTimeText) {
    return result.practiceTimeText
  }
  if (result.practiceSeconds) {
    return formatPracticeTime(result.practiceSeconds, false)
  }
  return formatPracticeTime((result.total || 0) * 12, true)
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
    reportHeroSrc: imageUrl('/images/home/exam-report-header-v3.jpg'),
    grade: '',
    encourage: '',
    sections: [],
    byType: [],
    wrong: [],
    hasWrong: false,
    practiceTimeText: '',
    practiceDateTimeText: '',
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
    const practiceTimeText = result.practiceTimeText || fallbackPracticeTimeText(result)

    this.setData({
      type: type,
      typeName: type === 'exit' ? '结业测报告' : '入门测报告',
      bookName: bookName,
      result: result,
      grade: gradeText(result.accuracy),
      encourage: encourageText(type, result.accuracy, compareReady ? delta : null),
      sections: sections,
      byType: byType,
      wrong: result.wrong,
      hasWrong: result.wrong.length > 0,
      practiceTimeText: practiceTimeText,
      practiceDateTimeText: formatPracticeDateTime(result.ts),
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
