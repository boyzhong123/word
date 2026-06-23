// pages/onboarding/onboarding.js
const { APP_NAME, APP_LOGO_SRC } = require('../../utils/app-brand')
const {
  GRADE_GROUPS,
  SEMESTERS,
  getStageByGradeId,
  getGradesByStage,
  getVersionsByStage,
  getStudentProfile,
  hasStudentProfile,
  saveStudentProfile
} = require('../../utils/student-profile')
const {
  GENDER_BOY,
  GENDER_GIRL,
  setCharacterGender,
  getCharacterGender
} = require('../../utils/character-gender')
const { bindPhoneNumber } = require('../../utils/api')
const { login, fetchLoginCode } = require('../../utils/login')
const { markEntryExamPromptPending } = require('../../utils/entry-exam-prompt')

const FEATURE_HIGHLIGHTS = [
  {
    title: '听单词和例句',
    desc: '原声音频伴读，课前预习路上磨耳朵',
    icon: '/images/home/icon-today-feature-listen.png',
    tag: ''
  },
  {
    title: '跟读背诵',
    desc: '开口跟读即时评分，发音问题看得见',
    icon: '/images/home/icon-today-feature-read.png',
    tag: 'AI 打分'
  },
  {
    title: '单词新学',
    desc: '按教材关卡推进新词，释义例句一起记',
    icon: '/images/home/icon-today-feature-recite.png',
    tag: ''
  },
  {
    title: '关卡小测',
    desc: '听音填空与错词巩固，学完马上检验',
    icon: '/images/home/icon-today-feature-quiz.png',
    tag: '错词复习'
  }
]

const ONBOARD_IMAGES = {
  intro: '/images/onboarding/onboard-intro-hero.png',
  grade: '/images/onboarding/onboard-step-grade.png',
  semester: '/images/onboarding/onboard-step-semester.png',
  textbook: '/images/onboarding/onboard-step-textbook.png'
}

const STEP_COPY = {
  1: {
    title: '孩子现在读几年级？',
    sub: '选好年级和学期，方便匹配同步教材'
  },
  2: {
    title: '用的是哪套教材？',
    sub: '选对版本，词表和句子才能和课堂一致'
  },
  3: {
    title: '再补充一点信息',
    sub: '选填即可，方便推荐更适合的学习资料'
  }
}

function getOnboardHeroSrc(step, images) {
  const list = [images.intro, images.grade, images.textbook, images.semester]
  return list[step] || images.intro
}

// navigationStyle:custom 下页面顶到屏幕最上，需手动让出状态栏 + 胶囊按钮的高度，
// 否则标题/返回键会被状态栏、胶囊遮挡。返回键与右上胶囊垂直居中对齐。
function getNavLayout() {
  const systemInfo = wx.getSystemInfoSync()
  const windowWidth = Number(systemInfo.windowWidth) || 375
  const statusBarHeight = Number(systemInfo.statusBarHeight) || 20
  let menuTop = statusBarHeight + 6
  let menuHeight = 32
  let menuBottom = statusBarHeight + 40
  if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
    const m = wx.getMenuButtonBoundingClientRect() || {}
    menuTop = Number(m.top) || menuTop
    menuHeight = Number(m.height) || menuHeight
    menuBottom = Number(m.bottom) || menuBottom
  }
  const toRpx = px => Math.round(px * 750 / windowWidth)
  return {
    navBarHeightRpx: toRpx(menuBottom) + 12,
    navBackTopRpx: toRpx(menuTop),
    navBackSizeRpx: toRpx(menuHeight)
  }
}

function maskPhoneNumber(phoneNumber) {
  const value = String(phoneNumber || '').replace(/\s/g, '')
  if (value.length < 7) {
    return value
  }
  return value.slice(0, 3) + '****' + value.slice(-4)
}

function pickPhoneNumber(data) {
  data = data || {}
  return data.phoneNumber || data.purePhoneNumber || data.mobile || data.phone || ''
}

function isPhoneVerifiedResponse(data) {
  data = data || {}
  return !!(pickPhoneNumber(data) || data.phoneVerified || data.mobileVerified)
}

function describePhoneAuthError(errMsg) {
  const value = String(errMsg || '')
  if (!value || value.indexOf(':ok') !== -1) {
    return ''
  }
  if (value.indexOf('deny') !== -1 || value.indexOf('cancel') !== -1) {
    return '已取消手机号授权'
  }
  return '手机号授权失败，请重试'
}

function buildStepUi(step, editMode) {
  const showBackButton = step >= 1
  const showSkipButton = step === 3 && !editMode
  let backButtonText = '上一步'
  if (step === 1) {
    backButtonText = editMode ? '取消' : '返回'
  }
  let primaryButtonText = '下一步'
  if (step === 0) {
    primaryButtonText = '开始设置'
  } else if (editMode && step === 2) {
    primaryButtonText = '保存'
  } else if (step === 3) {
    primaryButtonText = '完成，开始学习'
  } else if (!editMode && step === 2) {
    primaryButtonText = '下一步'
  }
  return {
    stepCopy: STEP_COPY[step] || { title: '', sub: '' },
    showBackButton,
    showSkipButton,
    backButtonText,
    primaryButtonText
  }
}

Page({
  data: {
    appName: APP_NAME,
    appLogoSrc: APP_LOGO_SRC,
    navBarHeightRpx: 0,
    navBackTopRpx: 0,
    navBackSizeRpx: 56,
    featureHighlights: FEATURE_HIGHLIGHTS,
    onboardImages: ONBOARD_IMAGES,
    onboardHeroSrc: getOnboardHeroSrc(0, ONBOARD_IMAGES),
    editMode: false,
    onboardingStep: 0,
    gradeGroups: GRADE_GROUPS,
    semesters: SEMESTERS,
    selectedStage: 'primary',
    visibleGrades: GRADE_GROUPS[0].grades,
    versions: [],
    selectedGradeId: '',
    selectedSemesterId: '',
    selectedVersion: '',
    selectedChildGender: '',
    phoneNumber: '',
    phoneVerified: false,
    maskedPhone: '',
    logined: false,
    stepCopy: { title: '', sub: '' },
    showBackButton: false,
    showSkipButton: false,
    backButtonText: '上一步',
    primaryButtonText: '开始设置'
  },

  onLoad(options) {
    this.setData(getNavLayout())
    const editMode = options && options.edit === '1'
    if (editMode) {
      this.initFromProfile()
      this.setOnboardingStep(1, { editMode: true })
      return
    }
    if (hasStudentProfile()) {
      wx.switchTab({ url: '/pages/today/today' })
      return
    }
    this.setData({ logined: !!wx.getStorageSync('token') })
    this.syncStepUi(0)
  },

  syncStepUi(step) {
    this.setData(buildStepUi(step, this.data.editMode))
  },

  setOnboardingStep(step, extra) {
    const payload = Object.assign({
      onboardingStep: step,
      onboardHeroSrc: getOnboardHeroSrc(step, this.data.onboardImages)
    }, extra || {})
    this.setData(payload)
    this.syncStepUi(step)
  },

  initFromProfile() {
    const profile = getStudentProfile() || {}
    const stage = getStageByGradeId(profile.gradeId) || 'primary'
    const phoneNumber = profile.phoneNumber || ''
    this.setData({
      selectedGradeId: profile.gradeId || '',
      selectedSemesterId: profile.semesterId || '',
      selectedVersion: profile.version || '',
      selectedChildGender: profile.childGender || getCharacterGender(),
      selectedStage: stage,
      visibleGrades: getGradesByStage(stage),
      versions: getVersionsByStage(stage),
      phoneNumber,
      phoneVerified: !!profile.phoneVerified,
      maskedPhone: maskPhoneNumber(phoneNumber)
    })
  },

  selectStage(event) {
    const stage = event.currentTarget.dataset.stage
    if (!stage || stage === this.data.selectedStage) {
      return
    }
    const currentStage = getStageByGradeId(this.data.selectedGradeId)
    const payload = {
      selectedStage: stage,
      visibleGrades: getGradesByStage(stage)
    }
    if (currentStage && currentStage !== stage) {
      payload.selectedGradeId = ''
      payload.versions = []
      payload.selectedVersion = ''
    }
    this.setData(payload)
  },

  selectGrade(event) {
    const gradeId = event.currentTarget.dataset.id
    const stage = getStageByGradeId(gradeId)
    const versions = getVersionsByStage(stage)
    this.setData({
      selectedStage: stage,
      visibleGrades: getGradesByStage(stage),
      selectedGradeId: gradeId,
      versions,
      selectedVersion: versions.indexOf(this.data.selectedVersion) >= 0 ? this.data.selectedVersion : ''
    })
  },

  selectSemester(event) {
    this.setData({ selectedSemesterId: event.currentTarget.dataset.id })
  },

  selectVersion(event) {
    this.setData({ selectedVersion: event.currentTarget.dataset.version })
  },

  selectChildGender(event) {
    const gender = event.currentTarget.dataset.gender
    if (!gender) {
      return
    }
    this.setData({
      selectedChildGender: gender === GENDER_GIRL ? GENDER_GIRL : GENDER_BOY
    })
  },

  ensureLogin() {
    if (this.data.logined || wx.getStorageSync('token')) {
      this.setData({ logined: true })
      return Promise.resolve(true)
    }
    return login().then(result => {
      const logined = !!(result && result.logined)
      this.setData({ logined })
      return logined
    }).catch(() => false)
  },

  handleGetPhoneNumber(event) {
    const detail = (event && event.detail) || {}
    const authError = describePhoneAuthError(detail.errMsg || '')
    if (authError) {
      wx.showToast({ title: authError, icon: 'none' })
      return
    }
    const phonePayload = {}
    if (detail.code) {
      phonePayload.code = detail.code
    }
    if (detail.encryptedData && detail.iv) {
      phonePayload.encryptedData = detail.encryptedData
      phonePayload.iv = detail.iv
    }
    if (!phonePayload.code && !phonePayload.encryptedData) {
      wx.showToast({ title: '当前微信版本不支持', icon: 'none' })
      return
    }
    this.ensureLogin().then(logined => {
      if (!logined) {
        wx.showToast({ title: '请先登录后再授权', icon: 'none' })
        return Promise.reject(new Error('not-logined'))
      }
      wx.showLoading({ title: '授权中', mask: true })
      return fetchLoginCode().then(loginCode => {
        if (loginCode) {
          phonePayload.loginCode = loginCode
        }
        return bindPhoneNumber(phonePayload)
      })
    }).then(data => {
      wx.hideLoading()
      if (!data || !isPhoneVerifiedResponse(data)) {
        wx.showToast({ title: '授权失败，请稍后再试', icon: 'none' })
        return
      }
      const phoneNumber = pickPhoneNumber(data)
      this.setData({
        phoneNumber,
        phoneVerified: true,
        maskedPhone: maskPhoneNumber(phoneNumber)
      })
      wx.showToast({ title: '手机号已授权', icon: 'success' })
    }).catch(error => {
      wx.hideLoading()
      if (error && error.message === 'not-logined') {
        return
      }
      console.log('[onboarding] bind phone failed', error)
      wx.showToast({ title: '授权失败，请稍后再试', icon: 'none' })
    })
  },

  nextOnboardingStep() {
    const { onboardingStep, selectedGradeId, selectedSemesterId, selectedVersion, editMode } = this.data
    if (onboardingStep === 0) {
      this.setOnboardingStep(1)
      return
    }
    if (onboardingStep === 1) {
      if (!selectedSemesterId) {
        wx.showToast({ title: '请选择学期', icon: 'none' })
        return
      }
      if (!selectedGradeId) {
        wx.showToast({ title: '请选择年级', icon: 'none' })
        return
      }
      this.setOnboardingStep(2)
      return
    }
    if (onboardingStep === 2) {
      if (!selectedVersion) {
        wx.showToast({ title: '请选择教材版本', icon: 'none' })
        return
      }
      if (editMode) {
        this.finishOnboarding()
        return
      }
      this.setOnboardingStep(3)
      return
    }
    this.finishOnboarding()
  },

  skipOptionalStep() {
    this.finishOnboarding()
  },

  prevOnboardingStep() {
    const { onboardingStep, editMode } = this.data
    if (onboardingStep <= 1) {
      if (editMode) {
        wx.navigateBack()
      } else if (onboardingStep === 1) {
        this.setOnboardingStep(0)
      }
      return
    }
    this.setOnboardingStep(onboardingStep - 1)
  },

  finishOnboarding() {
    const profilePayload = {
      gradeId: this.data.selectedGradeId,
      semesterId: this.data.selectedSemesterId,
      version: this.data.selectedVersion
    }
    if (this.data.selectedChildGender) {
      profilePayload.childGender = this.data.selectedChildGender
      setCharacterGender(this.data.selectedChildGender)
    }
    if (this.data.phoneVerified) {
      profilePayload.phoneNumber = this.data.phoneNumber
      profilePayload.phoneVerified = true
    }
    saveStudentProfile(profilePayload)
    if (this.data.editMode) {
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 400)
      return
    }
    markEntryExamPromptPending()
    wx.showToast({ title: '设置完成', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/today/today' })
    }, 400)
  }
})
