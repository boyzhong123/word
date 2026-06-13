// pages/finish/today.js
const { saveRecord } = require('../../utils/api')
const { getDailyGoal, getTodayDone, recordLevelDone } = require('../../utils/checkin-progress')
const { refreshHomePage } = require('../../utils/util')
const {
  getStageInfo,
  buildContinueUrl,
  hasContinueAction,
  normalizeTaskType
} = require('../../utils/finish-stage')
const {
  normalizeScoreRate,
  headerImageForScoreRate
} = require('../../utils/finish-stars')

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
    justCheckedIn: false,
    checkinComplete: false,
    rewardRemainingDays: STREAK_REWARD_DAYS,
    stageTitle: '完成今日学习!',
    continueLabel: '继续学习',
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
    this.bookName = options.name
      ? decodeURIComponent(options.name)
      : (this.book && this.book.name) || ''

    const resBookId = this.book && this.book.resBookId
    const todayGoal = getDailyGoal(resBookId)
    const todayDoneBefore = getTodayDone(resBookId)
    const todayDoneAfter = recordLevelDone(resBookId, options.unitId)
    const checkinComplete = todayDoneAfter >= todayGoal
    const justCheckedIn = todayDoneBefore < todayGoal && checkinComplete
    const stage = getStageInfo(this.taskType)
    const scoreRate = normalizeScoreRate(options.scoreRate)

    this.setData({
      unitSort: options.unitSort,
      unitCount: this.book.unitCount,
      wordnum: this.book.wordCount,
      proverbnum: this.book.proverbCount,
      bookname: this.book.name,
      todayDone: todayDoneAfter,
      todayGoal,
      justCheckedIn,
      checkinComplete,
      rewardRemainingDays: STREAK_REWARD_DAYS,
      stageTitle: stage.title,
      continueLabel: stage.continueLabel,
      scoreRate,
      headerImage: headerImageForScoreRate(scoreRate)
    })

    saveRecord(options.unitId).then(data => {
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
      nextUnitId: this.nextUnitId
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
    wx.switchTab({ url: '/pages/home/home' })
  }
})
