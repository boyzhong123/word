// pages/exam/exam.js
// 入门测 / 结业测答题页：单词 + 句子两个模块，多题型，做完跳报告页。
const {
  getExam,
  scoreExam,
  saveResult,
  getResult
} = require('../../utils/exam-data')
const { imageUrl } = require('../../utils/image-host')
const { player } = require('../../utils/player')

Page({
  data: {
    stage: 'intro',          // intro | quiz
    title: '',
    subtitle: '',
    total: 0,
    sections: [],

    index: 0,
    progress: 0,
    progressTrackStyle: '',
    counter: '',
    sectionName: '',
    question: null,

    selected: null,          // 选择题：选中下标
    ordered: [],             // 连词成句：已排好的词 [{text, key}]
    bank: [],                // 连词成句：词块 [{text, key, used}]
    canNext: false,
    isLast: false,
    audioPlaying: false,     // 听音题：发音播放中
    safeAreaBottom: 0,
    introHeroSrc: imageUrl('/images/home/exam-intro-hero-v2.jpg'),
    entryCompleted: false,
    lastResult: null,
    introTip: '认真作答，结束后会生成专属测评报告',
    introBtnText: '开始测评',
    dialog: { type: '' }     // 复用全局 dialog 组件，统一弹窗风格
  },

  onLoad(options) {
    options = options || {}
    this.resBookId = options.resBookId || ''
    this.examType = options.type === 'exit' ? 'exit' : 'entry'
    this.bookName = options.name ? decodeURIComponent(options.name) : ''

    this.responses = {}      // questionId -> 选项下标 / 词序数组
    this.orderStates = {}    // questionId -> 连词成句的 UI 状态，便于回看还原

    let safeAreaBottom = 0
    try {
      const info = wx.getSystemInfoSync()
      safeAreaBottom = Math.max(0, info.screenHeight - (info.safeArea ? info.safeArea.bottom : info.screenHeight))
    } catch (e) {}

    const exam = getExam(this.resBookId, this.examType)
    const lastResult = this.examType === 'entry' ? getResult(this.resBookId, 'entry') : null
    this.exam = exam
    this.setData({
      title: exam.title,
      subtitle: exam.subtitle,
      total: exam.total,
      sections: exam.sections,
      safeAreaBottom: safeAreaBottom,
      entryCompleted: !!lastResult,
      lastResult: lastResult,
      introTip: lastResult ? '入门测仅可完成一次，已为你保留上次成绩' : '认真作答，结束后会生成专属测评报告',
      introBtnText: lastResult ? '查看上次报告' : '开始测评'
    })
  },

  onShow() {
    player.suspendForExternalAudio('exam')
  },

  startExam() {
    if (this.examType === 'entry' && this.data.entryCompleted) {
      this.showEntryCompletedDialog()
      return
    }
    this.setData({ stage: 'quiz' })
    this.loadQuestion(0)
  },

  showEntryCompletedDialog() {
    const result = this.data.lastResult || {}
    const that = this
    this.setData({
      dialog: {
        type: 'general',
        title: '入门测只能进行一次',
        content: '你已完成入门测，本次不再重复测评。',
        subtitle: result.total ? '上次成绩：' + result.accuracy + '%，答对 ' + result.correct + '/' + result.total + ' 题。' : '',
        cancelText: '我知道了',
        confirmText: '查看报告',
        confirm: function () { that.goReport() }
      }
    })
  },

  goReport() {
    const query = 'resBookId=' + encodeURIComponent(this.resBookId) +
      '&type=' + this.examType +
      '&name=' + encodeURIComponent(this.bookName)
    wx.navigateTo({ url: '/pages/exam/exam-report?' + query })
  },

  loadQuestion(index) {
    const exam = this.exam
    const q = exam.questions[index]
    const sectionName = q.section === 'word' ? '单词' : '句子'
    const isLast = index === exam.total - 1

    // 切题时停掉上一题的发音
    this.stopAudio()

    const percent = Math.round(((index + 1) / exam.total) * 100)
    const view = {
      stage: 'quiz',
      index: index,
      progress: percent,
      // 照搬练习页：整宽细条用渐变填充，填充色统一为薄荷绿
      progressTrackStyle: 'background:linear-gradient(to right, #4dd9a0 ' + percent + '%, rgba(255,255,255,0.36) ' + percent + '%);',
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

  // 听音辨词：播放真实发音
  playAudio() {
    const q = this.data.question
    const src = q && q.audioUrl
    if (!src) {
      wx.showToast({ title: '暂无发音', icon: 'none' })
      return
    }
    if (!this.audioCtx) {
      this.audioCtx = wx.createInnerAudioContext({ useWebAudioImplement: false })
      this.audioCtx.onEnded(() => { this.setData({ audioPlaying: false }) })
      this.audioCtx.onStop(() => { this.setData({ audioPlaying: false }) })
      this.audioCtx.onError(() => {
        this.setData({ audioPlaying: false })
        wx.showToast({ title: '发音加载失败', icon: 'none' })
      })
    }
    this.audioCtx.stop()
    this.audioCtx.src = src
    this.audioCtx.play()
    this.setData({ audioPlaying: true })
    wx.vibrateShort && wx.vibrateShort({ type: 'light' })
  },

  stopAudio() {
    if (this.audioCtx) {
      this.audioCtx.stop()
    }
    if (this.data.audioPlaying) {
      this.setData({ audioPlaying: false })
    }
  },

  onUnload() {
    player.resumeFromExternalAudio('exam')
    if (this.audioCtx) {
      this.audioCtx.destroy()
      this.audioCtx = null
    }
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
      this.setData({
        dialog: {
          type: 'general',
          title: '还有题没做完',
          content: '确定交卷吗？',
          subtitle: '还有 ' + (this.exam.total - answered) + ' 题未作答。',
          cancelText: '再检查',
          confirmText: '交卷',
          confirm: function () { that.doSubmit() }
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

  // 返回：还没开始答题（intro 页）直接返回，不二次确认；答题中才确认
  confirmQuit() {
    if (this.data.stage !== 'quiz') {
      this.exitPage()
      return
    }
    const that = this
    this.setData({
      dialog: {
        type: 'general',
        title: '退出测评',
        content: '确认退出测评？',
        subtitle: '退出后本次作答不会保存。',
        cancelText: '继续答题',
        confirmText: '退出',
        confirm: function () { that.exitPage() }
      }
    })
  },

  exitPage() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/home/home' })
    }
  }
})
