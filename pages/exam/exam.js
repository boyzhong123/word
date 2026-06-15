// pages/exam/exam.js
// 入门测 / 结业测答题页：单词 + 句子两个模块，多题型，做完跳报告页。
const {
  getExam,
  scoreExam,
  saveResult
} = require('../../utils/exam-data')

Page({
  data: {
    stage: 'intro',          // intro | quiz
    title: '',
    subtitle: '',
    total: 0,
    sections: [],

    index: 0,
    progress: 0,
    counter: '',
    sectionName: '',
    question: null,

    selected: null,          // 选择题：选中下标
    ordered: [],             // 连词成句：已排好的词 [{text, key}]
    bank: [],                // 连词成句：词块 [{text, key, used}]
    canNext: false,
    isLast: false
  },

  onLoad(options) {
    options = options || {}
    this.resBookId = options.resBookId || ''
    this.examType = options.type === 'exit' ? 'exit' : 'entry'
    this.bookName = options.name ? decodeURIComponent(options.name) : ''

    this.responses = {}      // questionId -> 选项下标 / 词序数组
    this.orderStates = {}    // questionId -> 连词成句的 UI 状态，便于回看还原

    const exam = getExam(this.resBookId, this.examType)
    this.exam = exam
    this.setData({
      title: exam.title,
      subtitle: exam.subtitle,
      total: exam.total,
      sections: exam.sections
    })
  },

  startExam() {
    this.setData({ stage: 'quiz' })
    this.loadQuestion(0)
  },

  loadQuestion(index) {
    const exam = this.exam
    const q = exam.questions[index]
    const sectionName = q.section === 'word' ? '单词' : '句子'
    const isLast = index === exam.total - 1

    const view = {
      stage: 'quiz',
      index: index,
      progress: Math.round(((index + 1) / exam.total) * 100),
      counter: (index + 1) + ' / ' + exam.total,
      sectionName: sectionName,
      question: q,
      isLast: isLast,
      selected: null,
      ordered: [],
      bank: [],
      canNext: false
    }

    if (q.interaction === 'order') {
      const saved = this.orderStates[q.id]
      if (saved) {
        view.ordered = saved.ordered
        view.bank = saved.bank
        view.canNext = saved.ordered.length === q.tokens.length
      } else {
        view.bank = q.tokens.map(function (text, i) {
          return { text: text, key: i, used: false }
        })
        view.ordered = []
        view.canNext = false
      }
    } else {
      const resp = this.responses[q.id]
      view.selected = typeof resp === 'number' ? resp : null
      view.canNext = view.selected !== null
    }

    this.setData(view)
  },

  // 选择题：选中选项
  selectOption(e) {
    if (this.data.question.interaction === 'order') {
      return
    }
    const idx = e.currentTarget.dataset.idx
    this.responses[this.data.question.id] = idx
    this.setData({ selected: idx, canNext: true })
  },

  // 听音辨词：播放发音（音频接口后期接入，先做交互占位，避免暴露答案）
  playAudio() {
    wx.showToast({ title: '正在播放发音…', icon: 'none', duration: 800 })
    wx.vibrateShort && wx.vibrateShort({ type: 'light' })
  },

  // 连词成句：点词块入句
  pickToken(e) {
    const key = e.currentTarget.dataset.key
    const bank = this.data.bank.map(function (item) {
      return item.key === key ? Object.assign({}, item, { used: true }) : item
    })
    const token = this.data.bank.find(function (item) { return item.key === key })
    if (!token || token.used) {
      return
    }
    const ordered = this.data.ordered.concat([{ text: token.text, key: key }])
    this.commitOrder(ordered, bank)
  },

  // 连词成句：点已排的词撤回
  removeToken(e) {
    const key = e.currentTarget.dataset.key
    const ordered = this.data.ordered.filter(function (item) { return item.key !== key })
    const bank = this.data.bank.map(function (item) {
      return item.key === key ? Object.assign({}, item, { used: false }) : item
    })
    this.commitOrder(ordered, bank)
  },

  commitOrder(ordered, bank) {
    const q = this.data.question
    const canNext = ordered.length === q.tokens.length
    this.orderStates[q.id] = { ordered: ordered, bank: bank }
    this.responses[q.id] = ordered.map(function (item) { return item.text })
    this.setData({ ordered: ordered, bank: bank, canNext: canNext })
  },

  prevQuestion() {
    if (this.data.index > 0) {
      this.loadQuestion(this.data.index - 1)
    }
  },

  nextQuestion() {
    if (!this.data.canNext) {
      wx.showToast({ title: '先作答再继续', icon: 'none' })
      return
    }
    if (this.data.isLast) {
      this.submit()
    } else {
      this.loadQuestion(this.data.index + 1)
    }
  },

  submit() {
    const answered = Object.keys(this.responses).length
    if (answered < this.exam.total) {
      const that = this
      wx.showModal({
        title: '还有题没做完',
        content: '已作答 ' + answered + ' / ' + this.exam.total + ' 题，确定交卷吗？',
        confirmText: '交卷',
        cancelText: '再检查',
        success(res) {
          if (res.confirm) {
            that.doSubmit()
          }
        }
      })
      return
    }
    this.doSubmit()
  },

  doSubmit() {
    const result = scoreExam(this.exam, this.responses)
    saveResult(this.resBookId, this.examType, result)
    const query = 'resBookId=' + encodeURIComponent(this.resBookId) +
      '&type=' + this.examType +
      '&name=' + encodeURIComponent(this.bookName)
    wx.redirectTo({ url: '/pages/exam/exam-report?' + query })
  },

  // 答题中退出确认
  confirmQuit() {
    const that = this
    wx.showModal({
      title: '退出测评',
      content: '退出后本次作答不会保存，确定退出吗？',
      confirmText: '退出',
      cancelText: '继续答题',
      success(res) {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  }
})
