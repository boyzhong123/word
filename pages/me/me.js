const { getUserInfo, getUserBooks, saveUserInfo, bindPhoneNumber } = require('../../utils/api')
const { login, fetchLoginCode } = require('../../utils/login')
const { upload } = require('../../utils/util')
const { IMAGE_BASE_URL } = require('../../utils/image-host')
const {
  GENDER_BOY,
  GENDER_GIRL,
  getCharacterGender,
  setCharacterGender,
  pickGenderFromUserInfo
} = require('../../utils/character-gender')
const { getOfficialAccountWebSrcPath } = require('../../utils/official-account')

function getSafeArea() {
  const systemInfo = wx.getSystemInfoSync()
  const safeArea = systemInfo.safeArea || {}
  const safeAreaTop = safeArea.top || systemInfo.statusBarHeight || 0
  const safeAreaBottom = safeArea.bottom
    ? Math.max(systemInfo.windowHeight - safeArea.bottom, 0)
    : 0
  return { safeAreaTop, safeAreaBottom }
}

function pickNumber() {
  for (let i = 0; i < arguments.length; i++) {
    const value = Number(arguments[i])
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }
  return 0
}

function sumLearnedWords(books) {
  if (!Array.isArray(books)) {
    return 0
  }
  return books.reduce((total, book) => {
    const info = (book.learningInfo && book.learningInfo.book) || {}
    return total + pickNumber(info.learningWords, info.wordCount, book.learningWords)
  }, 0)
}

function pickAvatarUrl(data) {
  data = data || {}
  return data.avatarUrl || data.avatar || data.headImg || data.headImage || ''
}

function pickNickName(data) {
  data = data || {}
  return data.nickName || data.nickname || data.name || ''
}

function pickPhoneNumber(data) {
  data = data || {}
  return data.phoneNumber || data.purePhoneNumber || data.mobile || data.phone || ''
}

function maskPhoneNumber(phoneNumber) {
  const value = String(phoneNumber || '').replace(/\s/g, '')
  if (value.length < 7) {
    return value
  }
  return value.slice(0, 3) + '****' + value.slice(-4)
}

function buildSettings(phoneNumber, phoneVerified, logined, characterGender) {
  const verified = !!phoneVerified
  const canVerifyPhone = !!logined && !verified
  const gender = characterGender || getCharacterGender()
  return [
    {
      id: 'gender',
      label: '学习形象',
      desc: gender === GENDER_GIRL ? '当前为女生形象' : '当前为男生形象',
      action: 'gender',
      statusText: '',
      statusType: 'neutral',
      characterGender: gender
    },
    {
      id: 'phone',
      label: '手机号验证',
      desc: phoneNumber
        ? '已绑定 ' + maskPhoneNumber(phoneNumber)
        : (verified ? '已完成微信手机号验证' : '用于账号安全与找回进度'),
      action: 'phone',
      openType: canVerifyPhone ? 'getPhoneNumber' : '',
      statusText: verified ? '已验证' : '去验证',
      statusType: verified ? 'verified' : 'pending'
    },
    {
      id: 'privacy',
      label: '隐私与协议',
      desc: '账号安全和数据说明',
      url: '/pages/me/privacy',
      action: 'privacy'
    }
  ]
}

function isPhoneVerifiedResponse(data) {
  data = data || {}
  return !!(pickPhoneNumber(data) || data.phoneVerified || data.mobileVerified)
}

function pickRequestErrorMessage(error, fallback) {
  if (!error) {
    return fallback
  }
  if (typeof error === 'string') {
    return error
  }
  return error.message || fallback
}

function describePhoneAuthError(errMsg) {
  const value = String(errMsg || '')
  if (!value || value.indexOf(':ok') !== -1) {
    return ''
  }
  if (value.indexOf('deny') !== -1 || value.indexOf('cancel') !== -1) {
    return '已取消手机号授权'
  }
  if (value.indexOf('privacy') !== -1 || value.indexOf('scope') !== -1) {
    return '请先同意隐私协议后再验证'
  }
  return '手机号授权失败，请重试'
}

function parseUploadAvatarUrl(response) {
  if (!response) {
    return ''
  }
  let data = response
  if (typeof response === 'string') {
    try {
      data = JSON.parse(response)
    } catch (e) {
      return response
    }
  }
  if (typeof data === 'string') {
    return data
  }
  const nested = data.data || data.result || {}
  if (typeof nested === 'string') {
    return nested
  }
  return data.avatarUrl || data.url || data.path || nested.avatarUrl || nested.url || nested.path || ''
}

Page({
  data: {
    imageBaseUrl: IMAGE_BASE_URL,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    logined: false,
    userInfo: {},
    phoneNumber: '',
    phoneVerified: false,
    characterGender: GENDER_BOY,
    stats: {
      checkInDays: 0,
      learnedWords: 0,
      studyMinutes: 0
    },
    menus: [
      {
        id: 'book',
        label: '我的教材',
        desc: '查看当前学习内容',
        url: '/pages/me/book',
        action: 'book'
      },
      {
        id: 'contact',
        label: '联系客服',
        desc: '遇到问题时找我们',
        url: '/pages/me/contact',
        action: 'contact'
      }
    ],
    settings: buildSettings('', false, false, GENDER_BOY)
  },

  onLoad() {
    this.setData(getSafeArea())
    this.setData({
      characterGender: getCharacterGender(),
      settings: buildSettings('', false, false, getCharacterGender())
    })
    this.loadProfile()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    if (this.refresh) {
      this.refresh = false
      this.loadProfile()
    }
  },

  loadProfile() {
    login().then(result => {
      if (!result || !result.logined) {
        this.setData({
          logined: false,
          settings: buildSettings(this.data.phoneNumber, this.data.phoneVerified, false, this.data.characterGender)
        })
        return
      }
      this.setData({
        logined: true,
        settings: buildSettings(this.data.phoneNumber, this.data.phoneVerified, true, this.data.characterGender)
      })
      this.loadUserInfo()
      this.loadStats()
    }).catch(error => {
      console.log('[me] load profile fallback', error)
    })
  },

  ensureLoggedIn() {
    if (this.data.logined) {
      return Promise.resolve(true)
    }
    return login().then(result => {
      const logined = !!(result && result.logined)
      if (logined) {
        this.setData({ logined: true })
      }
      return logined
    })
  },

  loadUserInfo() {
    getUserInfo().then(data => {
      if (!data) {
        return
      }
      const userInfo = {
        avatarUrl: pickAvatarUrl(data),
        nickName: pickNickName(data)
      }
      const phoneNumber = pickPhoneNumber(data)
      const phoneVerified = !!(phoneNumber || data.phoneVerified || data.mobileVerified)
      const savedGender = pickGenderFromUserInfo(data)
      const characterGender = savedGender || this.data.characterGender
      if (savedGender) {
        setCharacterGender(savedGender)
      }
      this.setData({
        userInfo,
        phoneNumber,
        phoneVerified,
        characterGender,
        settings: buildSettings(phoneNumber, phoneVerified, this.data.logined, characterGender)
      })
    }).catch(() => {})
  },

  loadStats() {
    getUserInfo().then(data => {
      data = data || {}
      this.setData({
        'stats.checkInDays': pickNumber(data.continuousDays, data.checkInDays, data.signDays),
        'stats.studyMinutes': pickNumber(data.studyMinutes, data.learnMinutes)
      })
    }).catch(() => {})

    getUserBooks().then(books => {
      this.setData({
        'stats.learnedWords': sumLearnedWords(books)
      })
    }).catch(() => {})
  },

  handleLogin() {
    if (this.data.logined) {
      return
    }
    login().then(result => {
      if (result && result.logined) {
        this.setData({
          logined: true,
          settings: buildSettings(this.data.phoneNumber, this.data.phoneVerified, true, this.data.characterGender)
        })
        this.loadUserInfo()
        this.loadStats()
      }
    })
  },

  handleChooseAvatar(event) {
    const avatarUrl = event && event.detail && event.detail.avatarUrl
    if (!avatarUrl) {
      return
    }
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    })
    this.ensureLoggedIn().then(logined => {
      if (!logined) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }
      wx.showLoading({
        title: '保存中',
        mask: true
      })
      upload(avatarUrl).then(result => {
        const uploadedAvatarUrl = parseUploadAvatarUrl(result)
        return saveUserInfo({
          avatarUrl: uploadedAvatarUrl || avatarUrl
        }).then(userInfo => {
          const nextAvatarUrl = pickAvatarUrl(userInfo) || uploadedAvatarUrl || avatarUrl
          this.setData({
            'userInfo.avatarUrl': nextAvatarUrl
          })
          wx.showToast({
            title: '头像已更新',
            icon: 'success'
          })
        })
      }).then(() => {
        wx.hideLoading()
      }).catch(error => {
        wx.hideLoading()
        console.log('[me] save avatar failed', error)
        wx.showToast({
          title: '头像保存失败',
          icon: 'none'
        })
      })
    })
  },

  handleNickNameInput(event) {
    const nickName = event && event.detail ? event.detail.value : ''
    this.setData({
      'userInfo.nickName': nickName
    })
  },

  handleNickNameBlur(event) {
    const value = event && event.detail && typeof event.detail.value === 'string'
      ? event.detail.value
      : this.data.userInfo.nickName
    this.commitNickName(value)
  },

  commitNickName(nickName) {
    const value = String(nickName || '').trim()
    if (!value) {
      return
    }
    this.ensureLoggedIn().then(logined => {
      if (!logined) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }
      saveUserInfo({ nickName: value }).then(userInfo => {
        this.setData({
          'userInfo.nickName': pickNickName(userInfo) || value
        })
      }).catch(error => {
        console.log('[me] save nickname failed', error)
        wx.showToast({
          title: '昵称保存失败',
          icon: 'none'
        })
      })
    })
  },

  handleGetPhoneNumber(event) {
    const detail = (event && event.detail) || {}
    const errMsg = detail.errMsg || ''
    const authError = describePhoneAuthError(errMsg)
    if (authError) {
      wx.showToast({
        title: authError,
        icon: 'none'
      })
      console.log('[me] getPhoneNumber failed', errMsg)
      return
    }
    if (!this.data.logined) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
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
      wx.showToast({
        title: '当前微信版本不支持',
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      title: '验证中',
      mask: true
    })
    fetchLoginCode().then(loginCode => {
      if (loginCode) {
        phonePayload.loginCode = loginCode
      }
      return bindPhoneNumber(phonePayload)
    }).then(data => {
      if (!isPhoneVerifiedResponse(data)) {
        return Promise.reject({ message: '服务端暂未保存手机号，请联系客服' })
      }
      const phoneNumber = pickPhoneNumber(data)
      this.setData({
        phoneNumber,
        phoneVerified: true,
        settings: buildSettings(phoneNumber, true, this.data.logined, this.data.characterGender)
      })
      wx.showToast({
        title: '手机号已验证',
        icon: 'success'
      })
      wx.hideLoading()
    }).catch(error => {
      wx.hideLoading()
      console.log('[me] bind phone failed', error)
      wx.showToast({
        title: pickRequestErrorMessage(error, '手机号验证失败'),
        icon: 'none'
      })
    })
  },

  goStudyRecord() {
    this.navTo('/pages/study-record/record')
  },

  requestSubscribe() {
    const app = getApp()
    const tmplIds = (app.globalData && app.globalData.subscribeTmplIds) || []
    if (!tmplIds.length) {
      wx.showToast({
        title: '暂无可订阅的消息模板',
        icon: 'none'
      })
      return
    }
    wx.requestSubscribeMessage({
      tmplIds,
      complete: (res) => {
        const accepted = tmplIds.some(id => res[id] === 'accept')
        wx.showToast({
          title: accepted ? '已开启提醒' : '未开启提醒',
          icon: accepted ? 'success' : 'none'
        })
      }
    })
  },

  openOfficialAccount() {
    wx.navigateTo({
      url: getOfficialAccountWebSrcPath()
    })
  },

  openSetting() {
    if (typeof wx.openSetting === 'function') {
      wx.openSetting({})
    }
  },

  handleGenderSelect(event) {
    const gender = event && event.currentTarget && event.currentTarget.dataset.gender
    if (!gender || gender === this.data.characterGender) {
      return
    }
    const nextGender = setCharacterGender(gender)
    this.setData({
      characterGender: nextGender,
      settings: buildSettings(
        this.data.phoneNumber,
        this.data.phoneVerified,
        this.data.logined,
        nextGender
      )
    })
    this.ensureLoggedIn().then(logined => {
      if (!logined) {
        return
      }
      saveUserInfo({ characterGender: nextGender }).catch(error => {
        console.log('[me] save character gender failed', error)
      })
    })
    wx.showToast({
      title: nextGender === GENDER_GIRL ? '已切换为女生形象' : '已切换为男生形象',
      icon: 'none'
    })
  },

  handleMenuTap(event) {
    const action = event.currentTarget.dataset.action
    const url = event.currentTarget.dataset.url
    if (url) {
      this.navTo(url)
      return
    }
    if (action === 'phone') {
      this.ensureLoggedIn().then(logined => {
        if (!logined) {
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }
        this.setData({
          settings: buildSettings(this.data.phoneNumber, this.data.phoneVerified, true, this.data.characterGender)
        })
        wx.showToast({
          title: '请再次点击去验证',
          icon: 'none'
        })
      })
      return
    }
  },

  noop() {},

  onContact(event) {
    if (event && event.currentTarget && event.currentTarget.dataset.action === 'contact') {
      this.navTo('/pages/me/contact')
      return
    }
    console.log('[me] open customer service')
  },

  navToStudy() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  navTo(url) {
    wx.navigateTo({ url })
  }
})
