// pages/finish/today.js
const { saveRecord } = require('../../utils/api')
const { getDailyGoal, getTodayDone, recordLevelDone } = require('../../utils/checkin-progress')
const { refreshHomePage } = require('../../utils/util')
const {
  getStageInfo,
  buildStageProgress,
  buildContinueUrl,
  hasContinueAction,
  normalizeTaskType
} = require('../../utils/finish-stage')
const {
  normalizeScoreRate,
  headerImageForScoreRate
} = require('../../utils/finish-stars')
const { normalizeReturnTab, returnTabUrl } = require('../../utils/return-tab')

const STREAK_REWARD_DAYS = 30

Page({
  data: {
    unitSort: 1,
    unitCount: 0,
    wordnum: 0,
    proverbnum: 0,
    bookname: '',
    todayDone: 0,
    todayGoal: 0,
    overGoalCount: 0,
    justCheckedIn: false,
    checkinComplete: false,
    rewardRemainingDays: STREAK_REWARD_DAYS,
    stageTitle: '完成今日学习!',
    continueLabel: '继续学习',
    subSteps: [],
    summaryTitle: '',
    summarySub: '',
    showContinue: true,
    headerImage: headerImageForScoreRate(0),
    scoreRate: 0
  },

  onLoad(options) {
    options = options || {}
    this.book = getApp().globalData.book
    this.unitId = options.unitId || ''
    this.taskType = normalizeTaskType(options.taskType)
    this.resBookId = options.resBookId || (this.book && this.book.resBookId) || ''
    this.returnTab = normalizeReturnTab(options.returnTab)
    this.bookName = options.name
      ? decodeURIComponent(options.name)
      : (this.book && this.book.name) || ''

    const resBookId = this.book && this.book.resBookId
    const todayGoal = getDailyGoal(resBookId)
    const todayDoneBefore = getTodayDone(resBookId)
    // 一关固定三个环节（单词新学 → 跟读背诵 → 关卡小测）。
    // 只有走完最后一个环节（关卡小测，taskType=listening）才算通关、计入当日打卡；
    // 前两个环节不单独记关。分数不影响是否通关。
    const isUnitComplete = this.taskType === 'listening'
    const todayDoneAfter = isUnitComplete
      ? recordLevelDone(resBookId, options.unitId)
      : todayDoneBefore
    const checkinComplete = todayDoneAfter >= todayGoal
    const justCheckedIn = todayDoneBefore < todayGoal && checkinComplete
    const overGoalCount = checkinComplete && todayDoneAfter > todayGoal
      ? (todayDoneAfter - todayGoal)
      : 0
    const stage = getStageInfo(this.taskType)
    const stageProgress = buildStageProgress({
      taskType: this.taskType,
      unitSort: options.unitSort,
      unitCount: this.book.unitCount
    })
    const scoreRate = normalizeScoreRate(options.scoreRate)
    this.setData({
      unitSort: options.unitSort,
      unitCount: this.book.unitCount,
      wordnum: this.book.wordCount,
      proverbnum: this.book.proverbCount,
      bookname: this.book.name,
      todayDone: todayDoneAfter,
      todayGoal,
      overGoalCount,
      justCheckedIn,
      checkinComplete,
      rewardRemainingDays: STREAK_REWARD_DAYS,
      stageTitle: stage.title,
      continueLabel: stage.continueLabel,
      subSteps: stageProgress.subSteps,
      summaryTitle: stageProgress.summaryTitle,
      summarySub: stageProgress.summarySub,
      scoreRate,
      headerImage: headerImageForScoreRate(scoreRate)
    })

    saveRecord({
      unitId: options.unitId,
      taskType: this.taskType,
      scoreRate: scoreRate,
      resBookId: this.resBookId
    }).then(data => {
      this.nextUnitId = data && data.nextUnitId
      this.setData({
        showContinue: hasContinueAction(this.taskType, this.nextUnitId)
      })
    })

    refreshHomePage()
  },

  continue() {
    const url = buildContinueUrl({
      taskType: this.taskType,
      resBookId: this.resBookId,
      unitId: this.unitId,
      bookName: this.bookName,
      nextUnitId: this.nextUnitId,
      returnTab: this.returnTab
    })

    if (!url) {
      this.finish()
      return
    }

    wx.redirectTo({ url })
  },

  goCheckinCalendar() {
    wx.navigateTo({ url: '/pages/checkin/calendar' })
  },

  finish() {
    refreshHomePage()
    wx.switchTab({ url: returnTabUrl(this.returnTab) })
  }
})
