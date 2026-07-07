// 邀请好友：我的邀请码 + 生成海报 / 转发 + 邀请人与邀请记录。
// 机制：好友通过海报小程序码（scene）/ 分享卡片（query）/ 手动填码进入，
// 完成新手引导即绑定邀请关系（见 utils/invite.js 与 onboarding 第 3 步）。
const { getInviteSummary, getInviteQrcode, getUserInfo, getUserBooks } = require('../../utils/api')
const { login } = require('../../utils/login')
const { describeInviteSource } = require('../../utils/invite')
const { saveImageWithAlbumPermission } = require('../../utils/photos-album-permission')
const { sumLearnedWords } = require('../../utils/learned-progress')
const { APP_LOGO_SRC } = require('../../utils/app-brand')
const { imageUrl } = require('../../utils/image-host')
const { drawInvitePoster, POSTER_THEMES } = require('./invite-poster')

const DEFAULT_NICKNAME = '爱学习的小词友'
const DEFAULT_AVATAR = '../../images/home/mascot-report-jelly.png'

function toCanvasImageSrc(src) {
  return src ? src.replace(/^\.\.\/\.\.\//, '/') : src
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

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatInviteTime(timestamp) {
  const value = Number(timestamp) || 0
  if (!value) {
    return ''
  }
  const date = new Date(value)
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

// 邀请记录/邀请人整理成展示结构（昵称兜底 + 时间来源状态文案）
function formatInviteePerson(person) {
  person = person || {}
  const success = person.status === 'success'
  return {
    nickName: person.nickName || '微信用户',
    avatarUrl: person.avatarUrl || '',
    timeText: formatInviteTime(person.at || person.boundAt),
    sourceText: describeInviteSource(person.source),
    statusText: success ? '邀请成功' : '待完成引导',
    statusType: success ? 'success' : 'pending'
  }
}

function formatInviter(inviter) {
  if (!inviter) {
    return null
  }
  return {
    nickName: inviter.nickName || '微信用户',
    avatarUrl: inviter.avatarUrl || '',
    timeText: formatInviteTime(inviter.boundAt),
    sourceText: describeInviteSource(inviter.source)
  }
}

Page({
  data: {
    heroCoverBg: imageUrl('/images/invite/invite-hero-cover.png'),
    shareCoverImage: imageUrl('/images/invite/invite-share-cover.jpg'),
    emptyStateImage: imageUrl('/images/invite/invite-empty-state.png'),
    loading: true,
    myCode: '',
    inviter: null,
    invitees: [],
    successCount: 0,
    nickName: DEFAULT_NICKNAME,
    avatarSrc: DEFAULT_AVATAR,
    stats: {
      continuousDays: 0,
      learnedWords: 0,
      studyMinutes: 0
    },
    showPosterDialog: false,
    posterThemes: POSTER_THEMES,
    posterThemeIndex: 0,
    posterTheme: POSTER_THEMES[0],
    posterPaths: {
      gift: '',
      study: '',
      campus: ''
    }
  },

  onLoad() {
    login().catch(() => null).then(() => {
      this.loadSummary()
      this.loadProfile()
    })
  },

  loadSummary() {
    getInviteSummary().then(summary => {
      this.setData({
        loading: false,
        myCode: summary.myCode,
        inviter: formatInviter(summary.inviter),
        invitees: (summary.invitees || []).map(formatInviteePerson),
        successCount: summary.successCount
      })
    }).catch(error => {
      console.log('[invite] load summary failed', error)
      this.setData({ loading: false })
    })
  },

  // 海报数据与我的页/打卡页同口径：昵称头像 + 连续打卡 / 累计学词 / 学习分钟
  loadProfile() {
    getUserInfo().then(data => {
      data = data || {}
      this.setData({
        nickName: data.nickName || data.nickname || data.name || DEFAULT_NICKNAME,
        avatarSrc: data.avatarUrl || data.avatar || data.headImg || DEFAULT_AVATAR,
        'stats.continuousDays': pickNumber(data.continuousDays, data.checkInDays, data.signDays),
        'stats.studyMinutes': pickNumber(data.studyMinutes, data.learnMinutes)
      })
    }).catch(() => {})
    getUserBooks().then(books => {
      this.setData({ 'stats.learnedWords': sumLearnedWords(books) })
    }).catch(() => {})
  },

  copyInviteCode() {
    if (!this.data.myCode) {
      return
    }
    wx.setClipboardData({
      data: this.data.myCode,
      success: () => {
        wx.showToast({ title: '邀请码已复制', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' })
      }
    })
  },

  openPosterDialog() {
    if (!this.data.myCode) {
      wx.showToast({ title: '邀请码加载中…', icon: 'none' })
      return
    }
    this.posterCache = {}
    this.setData({
      showPosterDialog: true,
      posterThemeIndex: 0,
      posterTheme: POSTER_THEMES[0],
      posterPaths: {
        gift: '',
        study: '',
        campus: ''
      }
    })
    this.posterRenderQueue = Promise.resolve()
    POSTER_THEMES.forEach(theme => this.enqueuePosterRender(theme))
  },

  closePosterDialog() {
    this.setData({ showPosterDialog: false })
  },

  noop() {},

  getPosterCanvas() {
    if (!this.posterCanvasPromise) {
      this.posterCanvasPromise = new Promise((resolve, reject) => {
        this.createSelectorQuery()
          .select('#invite-poster')
          .fields({ node: true })
          .exec(res => {
            const canvas = res && res[0] && res[0].node
            if (canvas) {
              resolve(canvas)
            } else {
              reject(new Error('invite poster canvas not found'))
            }
          })
      })
    }
    return this.posterCanvasPromise
  },

  onPosterThemeSwipe(event) {
    const index = Number(event.detail.current)
    const theme = POSTER_THEMES[index]
    if (!theme || index === this.data.posterThemeIndex) {
      return
    }
    this.setData({
      posterThemeIndex: index,
      posterTheme: theme
    })
    if (!this.data.posterPaths[theme]) {
      this.enqueuePosterRender(theme)
    }
  },

  enqueuePosterRender(theme) {
    const targetTheme = theme || this.data.posterTheme
    if (POSTER_THEMES.indexOf(targetTheme) < 0) {
      return
    }
    const cache = this.posterCache || {}
    if (cache[targetTheme]) {
      this.setData({ ['posterPaths.' + targetTheme]: cache[targetTheme] })
      return
    }
    this.posterRenderQueue = this.posterRenderQueue || Promise.resolve()
    this.posterRenderQueue = this.posterRenderQueue.then(() => this.renderPoster(targetTheme))
  },

  renderPoster(theme) {
    const targetTheme = theme || this.data.posterTheme
    const cache = this.posterCache || {}
    const systemInfo = wx.getSystemInfoSync()
    return getInviteQrcode().then(qrSrc => {
      const options = {
        theme: targetTheme,
        nickName: this.data.nickName,
        avatarSrc: toCanvasImageSrc(this.data.avatarSrc),
        logoSrc: APP_LOGO_SRC,
        qrSrc,
        inviteCode: this.data.myCode,
        continuousDays: this.data.stats.continuousDays,
        learnedWords: this.data.stats.learnedWords,
        studyMinutes: this.data.stats.studyMinutes,
        dpr: Math.min(Number(systemInfo.pixelRatio) || 2, 3)
      }
      return this.getPosterCanvas().then(canvas => {
        return drawInvitePoster(canvas, options).then(() => canvas)
      })
    }).then(canvas => new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas,
        success: res => resolve(res.tempFilePath),
        fail: reject
      })
    })).then(path => {
      cache[targetTheme] = path
      if (this.data.showPosterDialog) {
        this.setData({ ['posterPaths.' + targetTheme]: path })
      }
    }).catch(error => {
      console.log('[invite] render poster failed', targetTheme, error)
      if (targetTheme === this.data.posterTheme) {
        wx.showToast({ title: '海报生成失败，请重试', icon: 'none' })
      }
    })
  },

  getFreshPosterPath() {
    const cache = this.posterCache || {}
    const theme = this.data.posterTheme
    const path = this.data.posterPaths[theme]
    return path && cache[theme] === path ? path : ''
  },

  savePoster() {
    const path = this.getFreshPosterPath()
    if (!path) {
      wx.showToast({ title: '海报生成中…', icon: 'none' })
      return
    }
    saveImageWithAlbumPermission(path)
  },

  sendPoster() {
    const path = this.getFreshPosterPath()
    if (!path) {
      wx.showToast({ title: '海报生成中…', icon: 'none' })
      return
    }
    if (typeof wx.showShareImageMenu === 'function') {
      wx.showShareImageMenu({ path })
    } else {
      // 低版本基础库兜底：预览后长按可转发
      wx.previewImage({ urls: [path] })
    }
  },

  // 分享卡片带邀请码：落地今日页，app.onShow 统一捕获 inviteCode（老用户忽略）
  onShareAppMessage() {
    return {
      title: '每天10分钟，把英语学扎实',
      path: '/pages/today/today?inviteCode=' + this.data.myCode,
      imageUrl: this.data.shareCoverImage
    }
  },

  onShareTimeline() {
    return {
      title: '每天10分钟，把英语学扎实',
      query: 'inviteCode=' + this.data.myCode,
      imageUrl: this.data.shareCoverImage
    }
  }
})
