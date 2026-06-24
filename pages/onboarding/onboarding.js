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
const { bindPhoneNumber, getUserBooks, toggleBook } = require('../../utils/api')
const { login, fetchLoginCode } = require('../../utils/login')
const { markEntryExamPromptPending } = require('../../utils/entry-exam-prompt')
const { imageUrl } = require('../../utils/image-host')
const { withTestBook, applyDevPurchaseToBooks } = require('../../utils/dev-books')
const { withMockTextbooks } = require('../../utils/mock-textbooks')
const { matchRecommendedBook } = require('../../utils/book-match')

// 首屏三张长图（定位 / 痛点+流程 / 亮点+坚持），底部按钮保留原生
const INTRO_PANELS = [
  '/images/onboarding/onboard-panel-01.jpg',
  '/images/onboarding/onboard-panel-02.jpg',
  '/images/onboarding/onboard-panel-03.jpg'
].map(imageUrl)

const ONBOARD_IMAGES = {
  intro: '/images/onboarding/onboard-intro-hero.png',
  grade: '/images/onboarding/onboard-step-grade.png',
  semester: '/images/onboarding/onboard-step-semester.png',
  textbook: '/images/onboarding/onboard-step-textbook.png'
}
Object.keys(ONBOARD_IMAGES).forEach(key => {
  ONBOARD_IMAGES[key] = imageUrl(ONBOARD_IMAGES[key])
})

// 教材版本首屏最多展示 3 行（2 列 × 3 行），超出后通过「查看更多」展开
const VERSION_PREVIEW_COUNT = 6

function mergeVersionPickerData(versions, selectedVersion, versionsExpanded) {
  const list = Array.isArray(versions) ? versions : []
  const selectedIndex = list.indexOf(selectedVersion)
  const needToggle = list.length > VERSION_PREVIEW_COUNT
  const expanded = needToggle && (versionsExpanded || selectedIndex >= VERSION_PREVIEW_COUNT)
  const displayVersions = needToggle && !expanded
    ? list.slice(0, VERSION_PREVIEW_COUNT)
    : list
  const hiddenCount = list.length - VERSION_PREVIEW_COUNT
  return {
    versions: list,
    selectedVersion,
    displayVersions,
    versionsExpanded: expanded,
    showVersionMoreToggle: needToggle,
    versionMoreLabel: expanded
      ? '收起'
      : `查看更多教材${hiddenCount > 0 ? '（' + hiddenCount + '）' : ''}`
  }
}

const STEP_COPY = {
  0: {
    title: '帮孩子把英语学扎实',
    sub: '同步教材，听·读·背·测，每天10分钟记牢'
  },
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

function getStepKicker(step, editMode) {
  if (step === 0) {
    return '欢迎体验'
  }
  if (editMode) {
    return '修改设置'
  }
  return '首次设置'
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
    stepKicker: getStepKicker(step, editMode),
    showBackButton,
    showSkipButton,
    backButtonText,
    primaryButtonText
  }
}

function isPrimaryActionReady(data, step) {
  const onboardingStep = typeof step === 'number' ? step : data.onboardingStep
  const {
    selectedGradeId,
    selectedSemesterId,
    selectedVersion
  } = data || {}

  if (onboardingStep === 1) {
    return !!(selectedGradeId && selectedSemesterId)
  }

  if (onboardingStep === 2) {
    return !!selectedVersion
  }

  return true
}

Page({
  data: {
    appName: APP_NAME,
    appLogoSrc: APP_LOGO_SRC,
    navBarHeightRpx: 0,
    navBackTopRpx: 0,
    navBackSizeRpx: 56,
    introPanels: INTRO_PANELS,
    onboardImages: ONBOARD_IMAGES,
    onboardHeroSrc: getOnboardHeroSrc(0, ONBOARD_IMAGES),
    editMode: false,
    onboardingStep: 0,
    gradeGroups: GRADE_GROUPS,
    semesters: SEMESTERS,
    selectedStage: 'primary',
    visibleGrades: GRADE_GROUPS[0].grades,
    versions: [],
    displayVersions: [],
    versionsExpanded: false,
    showVersionMoreToggle: false,
    versionMoreLabel: '',
    selectedGradeId: '',
    selectedSemesterId: '',
    selectedVersion: '',
    selectedChildGender: '',
    phoneNumber: '',
    phoneVerified: false,
    maskedPhone: '',
    logined: false,
    stepCopy: { title: '', sub: '' },
    stepKicker: '欢迎体验',
    showBackButton: false,
    showSkipButton: false,
    backButtonText: '上一步',
    primaryButtonText: '开始设置',
    primaryButtonDisabled: false
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
    const editMode = this.data.editMode
    this.setData(Object.assign(
      buildStepUi(step, editMode),
      { primaryButtonDisabled: !isPrimaryActionReady(this.data, step) }
    ))
  },

  refreshPrimaryButtonState(nextData) {
    const mergedData = Object.assign({}, this.data, nextData || {})
    this.setData({
      primaryButtonDisabled: !isPrimaryActionReady(mergedData, mergedData.onboardingStep)
    })
  },

  setOnboardingStep(step, extra) {
    const editMode = extra && extra.editMode !== undefined ? extra.editMode : this.data.editMode
    const mergedData = Object.assign({}, this.data, { onboardingStep: step }, extra || {})
    this.setData(Object.assign({
      onboardingStep: step,
      onboardHeroSrc: getOnboardHeroSrc(step, this.data.onboardImages)
    }, buildStepUi(step, editMode), {
      primaryButtonDisabled: !isPrimaryActionReady(mergedData, step)
    }, extra || {}))
  },

  initFromProfile() {
    const profile = getStudentProfile() || {}
    const stage = getStageByGradeId(profile.gradeId) || 'primary'
    const phoneNumber = profile.phoneNumber || ''
    const nextData = Object.assign({
      selectedGradeId: profile.gradeId || '',
      selectedSemesterId: profile.semesterId || '',
      selectedChildGender: profile.childGender || getCharacterGender(),
      selectedStage: stage,
      visibleGrades: getGradesByStage(stage),
      phoneNumber,
      phoneVerified: !!profile.phoneVerified,
      maskedPhone: maskPhoneNumber(phoneNumber)
    }, mergeVersionPickerData(getVersionsByStage(stage), profile.version || '', false))
    this.setData(nextData)
    this.refreshPrimaryButtonState(nextData)
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
      Object.assign(payload, mergeVersionPickerData([], '', false))
    }
    this.setData(payload)
    this.refreshPrimaryButtonState(payload)
  },

  selectGrade(event) {
    const gradeId = event.currentTarget.dataset.id
    const stage = getStageByGradeId(gradeId)
    const versions = getVersionsByStage(stage)
    const selectedVersion = versions.indexOf(this.data.selectedVersion) >= 0 ? this.data.selectedVersion : ''
    const nextData = Object.assign({
      selectedStage: stage,
      visibleGrades: getGradesByStage(stage),
      selectedGradeId: gradeId
    }, mergeVersionPickerData(versions, selectedVersion, false))
    this.setData(nextData)
    this.refreshPrimaryButtonState(nextData)
  },

  selectSemester(event) {
    const nextData = { selectedSemesterId: event.currentTarget.dataset.id }
    this.setData(nextData)
    this.refreshPrimaryButtonState(nextData)
  },

  selectVersion(event) {
    const nextData = mergeVersionPickerData(
      this.data.versions,
      event.currentTarget.dataset.version,
      this.data.versionsExpanded
    )
    this.setData(nextData)
    this.refreshPrimaryButtonState(nextData)
  },

  toggleVersionMore() {
    const { versions, selectedVersion, versionsExpanded } = this.data
    if (versionsExpanded) {
      const selectedIndex = versions.indexOf(selectedVersion)
      if (selectedIndex >= VERSION_PREVIEW_COUNT) {
        return
      }
    }
    const nextData = mergeVersionPickerData(versions, selectedVersion, !versionsExpanded)
    this.setData(nextData)
  },

  selectChildGender(event) {
    const gender = event.currentTarget.dataset.gender
    if (!gender) {
      return
    }
    const nextData = {
      selectedChildGender: gender === GENDER_GIRL ? GENDER_GIRL : GENDER_BOY
    }
    this.setData(nextData)
    this.refreshPrimaryButtonState(nextData)
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
      const nextData = {
        phoneNumber,
        phoneVerified: true,
        maskedPhone: maskPhoneNumber(phoneNumber)
      }
      this.setData(nextData)
      this.refreshPrimaryButtonState(nextData)
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
    const {
      onboardingStep,
      primaryButtonDisabled,
      selectedGradeId,
      selectedSemesterId,
      selectedVersion,
      editMode
    } = this.data
    if (onboardingStep === 0) {
      this.setOnboardingStep(1)
      return
    }
    if (onboardingStep === 1) {
      if (primaryButtonDisabled || !selectedSemesterId) {
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
      if (primaryButtonDisabled || !selectedVersion) {
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
    if (onboardingStep === 3) {
      if (!this.data.selectedChildGender) {
        wx.showToast({ title: '请选择学习形象', icon: 'none' })
        return
      }
      if (!this.data.phoneVerified) {
        wx.showToast({ title: '请授权手机号', icon: 'none' })
        return
      }
      this.finishOnboarding()
    }
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
    const profile = saveStudentProfile(profilePayload)
    const editMode = this.data.editMode
    // 教材联动：按 年级/学期/版本 匹配教材目录并自动设为默认词书，再进入今日页（最长等待 1.5s 不阻塞跳转）
    this.applyRecommendedBook(profile).then(() => {
      if (editMode) {
        wx.showToast({ title: '已保存', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 400)
        return
      }
      markEntryExamPromptPending()
      wx.showToast({ title: '设置完成', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/today/today' })
      }, 400)
    })
  },

  // 按档案匹配教材目录，命中则把推荐教材设为默认词书（演示书仅本地切，真实书调 switch-default-book）。
  // 任何失败都不阻断引导完成：超时/无网/无命中都回退后端 defaultBook。
  applyRecommendedBook(profile) {
    if (!profile || !profile.gradeId || !profile.version) {
      return Promise.resolve(null)
    }
    const matchAndSwitch = login().then(result => {
      if (!result || !result.logined) {
        return null
      }
      return getUserBooks()
    }).then(books => {
      const list = applyDevPurchaseToBooks(
        withMockTextbooks(withTestBook(Array.isArray(books) ? books : []))
      )
      const matched = matchRecommendedBook(list, profile)
      if (!matched || !matched.resBookId) {
        return null
      }
      const app = getApp()
      app.globalData.pendingBookId = matched.resBookId
      app.globalData.book = Object.assign({}, app.globalData.book, matched)
      if (matched.demo) {
        return matched
      }
      return toggleBook(matched.resBookId).then(() => matched).catch(() => matched)
    }).catch(() => null)

    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 1500))
    return Promise.race([matchAndSwitch, timeout])
  }
})
