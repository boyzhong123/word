const util = require('./util')
const mockStore = require('./mock/mock-store')

// 会员态数据访问：mock 模式直接读本地 mock-store（演示用「假后端」）；
// 接后端时把 mock-store 的 USE_MOCK 置 false，本函数自动改走 GET /mini-app/membership，
// 并 hydrate 进 mock-store 供同步的 getMembership() 使用。建议在 app.onLaunch 调一次。
function fetchMembership() {
  if (mockStore.USE_MOCK) {
    return Promise.resolve(mockStore.getSlice('membership'))
  }
  return new Promise(resolve => {
    util.request('GET', '/mini-app/membership', {}, (data) => {
      if (data && typeof data === 'object') {
        mockStore.hydrate({ membership: data })
      }
      resolve(mockStore.getSlice('membership'))
    }, () => {
      resolve(mockStore.getSlice('membership'))
    })
  })
}

function saveUserInfo(userInfo) {
  return new Promise(resolve => {
    util.request('POST', '/mini-app/user/info-update', { data: userInfo }, (data) => {
      resolve(data)
    })
  })
}

function normalizePhonePayload(phoneInfo) {
  const payload = Object.assign({}, phoneInfo || {})
  if (payload.code && !payload.phoneCode) {
    payload.phoneCode = payload.code
  }
  return payload
}

function buildPhoneBindError(status, data, message) {
  if (status === 404) {
    return { status, message: '手机号绑定服务暂未开通，请联系客服' }
  }
  if (typeof message === 'string' && message) {
    return { status, data, message }
  }
  if (status === 401 || (data && data.code === 401)) {
    return { status, message: '登录已过期，请重新登录后再试' }
  }
  return { status, data, message: message || '手机号验证失败' }
}

function bindPhoneNumber(phoneInfo) {
  const payload = normalizePhonePayload(phoneInfo)
  return new Promise((resolve, reject) => {
    util.request('POST', '/mini-app/user/phone-number', { data: payload }, (data) => {
      resolve(data)
    }, (status, data, message) => {
      reject(buildPhoneBindError(status, data, message))
    })
  })
}

// ── 邀请关系（演示走 mock-store.invite，接后端时 USE_MOCK=false 自动改走 /mini-app/invite/*）──
// 邀请码字符集：去掉 0/O/1/I 易混字符；真实码由后端按 userId 生成、全局唯一
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function buildMockInviteCode() {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)]
  }
  return code
}

function normalizeInviteSummary(data) {
  data = data || {}
  const invitees = Array.isArray(data.invitees) ? data.invitees : []
  return {
    myCode: data.myCode || '',
    inviter: data.inviter || null,
    invitees,
    successCount: invitees.filter(item => item && item.status === 'success').length
  }
}

// mock 模式首次访问时生成并持久化本机邀请码
function ensureMockInvite() {
  const invite = mockStore.getSlice('invite') || {}
  if (!invite.myCode) {
    invite.myCode = buildMockInviteCode()
    mockStore.setSlice('invite', invite)
  }
  return invite
}

function getInviteSummary() {
  if (mockStore.USE_MOCK) {
    return Promise.resolve(normalizeInviteSummary(ensureMockInvite()))
  }
  return new Promise(resolve => {
    util.request('GET', '/mini-app/invite/summary', {}, (data) => {
      if (data && typeof data === 'object') {
        mockStore.hydrate({ invite: data })
      }
      resolve(normalizeInviteSummary(mockStore.getSlice('invite')))
    }, () => {
      resolve(normalizeInviteSummary(mockStore.getSlice('invite')))
    })
  })
}

// 校验邀请码并返回邀请人信息（引导第 3 步回显用）；自邀/不存在走 reject
function validateInviteCode(code) {
  if (mockStore.USE_MOCK) {
    const invite = ensureMockInvite()
    if (code === invite.myCode) {
      return Promise.reject({ message: '不能填自己的邀请码' })
    }
    // 演示假后端：任意格式合法的码都视为有效，邀请人昵称按码尾生成
    return Promise.resolve({
      code,
      nickName: '刷刷学伴' + code.slice(-2),
      avatarUrl: ''
    })
  }
  return new Promise((resolve, reject) => {
    util.request('GET', '/mini-app/invite/validate', {
      data: { code }
    }, (data) => {
      resolve(data)
    }, (status, data, message) => {
      reject({ status, data, message: message || '邀请码不存在，请检查后重新输入' })
    })
  })
}

// 完成新手引导时绑定邀请关系（服务端需校验：新用户、非自邀、未绑定过；成功后不可变更）
function bindInviteCode(code, source) {
  if (mockStore.USE_MOCK) {
    const invite = ensureMockInvite()
    if (invite.inviter) {
      return Promise.reject({ message: '邀请关系已绑定，不可修改' })
    }
    if (code === invite.myCode) {
      return Promise.reject({ message: '不能填自己的邀请码' })
    }
    invite.inviter = {
      code,
      nickName: '刷刷学伴' + code.slice(-2),
      avatarUrl: '',
      source: source || 'manual',
      boundAt: Date.now()
    }
    mockStore.setSlice('invite', invite)
    return Promise.resolve(invite.inviter)
  }
  return new Promise((resolve, reject) => {
    util.request('POST', '/mini-app/invite/bind', {
      data: { code, source }
    }, (data) => {
      resolve(data)
    }, (status, data, message) => {
      reject({ status, data, message: message || '邀请绑定失败' })
    })
  })
}

// 取带参小程序码图片地址（后端调 getUnlimited：scene = "i=<邀请码>"，page 为已发布页面）。
// mock/失败兜底：返回占位码图，保证海报可生成。
function getInviteQrcode() {
  const fallback = '/images/checkin/share-qrcode.png'
  if (mockStore.USE_MOCK) {
    return Promise.resolve(fallback)
  }
  return new Promise(resolve => {
    util.request('GET', '/mini-app/invite/qrcode', {}, (data) => {
      resolve((data && (data.url || data.qrcodeUrl)) || fallback)
    }, () => {
      resolve(fallback)
    })
  })
}

function getUserBooks() {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/user-books', {}, (data) => {
      resolve(Array.isArray(data) ? data : [])
    }, () => {
      resolve([])
    })
  })
}

function getUserInfo() {
  return new Promise(resolve => {
    util.request('POST', '/mini-app/user/info', {}, (data) => {
      resolve(data)
    })
  })
}

function search(value) {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/search', {
      data: {
        words: value,
        limit: 20
      }
    }, (data) => {
      resolve([{
        title: '单词',
        words: data.word
      }, {
        title: '谚语',
        proverbs: data.proverb
      }])
    })
  })
}

function getWordInfo(id) {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/word-info', {
      data: { id }
    }, (data) => {
      resolve(data)
    })
  })
}

function getSentence() {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/today-proverb', {}, (data) => {
      resolve(data)
    })
  })
}
function toggleBook(resBookId) {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/switch-default-book', {
      data: {
        resBookId
      }
    }, (data) => {
      resolve(data)
    })
  })
}

const {
  isDemoUnitsEnabled,
  isDemoUnitId,
  buildDemoUnitResource,
  resolveDemoUnitResource,
  buildDemoUnitsList
} = require('./demo-unit-mock')

function resolveDemoUnitsResponse(data) {
  const demoList = buildDemoUnitsList()
  return {
    list: demoList,
    pageInfo: Object.assign({}, data && data.pageInfo, { total: demoList.length })
  }
}

function getUnits(resBookId, page = 1, rows = 2000) {
  if (isDemoUnitsEnabled()) {
    return Promise.resolve(resolveDemoUnitsResponse())
  }
  return new Promise(resolve => {
    util.request('GET', '/mini-app/book-units', {
      data: {
        resBookId,
        page,
        rows
      }
    }, (data) => {
      resolve(data)
    }, () => {
      resolve({
        list: [],
        pageInfo: {
          total: 0
        }
      })
    })
  })
}

function saveRecord(payload) {
  const data = typeof payload === 'string'
    ? { unitId: payload }
    : Object.assign({}, payload || {})
  return new Promise(resolve => {
    util.request('POST', '/mini-app/save-learning-record', {
      data
    }, (response) => {
      resolve(response)
    }, () => {
      resolve(null)
    })
  })
}

function reportWordMark(payload) {
  return new Promise(resolve => {
    util.request('POST', '/mini-app/word-mark', {
      data: payload
    }, () => {
      resolve(true)
    }, () => {
      resolve(false)
    })
  })
}

function reportRecitationScore(payload) {
  return new Promise(resolve => {
    util.request('POST', '/mini-app/recitation-score', {
      data: payload
    }, () => {
      resolve(true)
    }, () => {
      resolve(false)
    })
  })
}

function getUnitWords(unitId) {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/unit-resources', {
      data: {
        unitId
      }
    }, (data) => {
      resolve(data)
    })
  })
}

function getUnitResource(unitId) {
  if (isDemoUnitsEnabled()) {
    return Promise.resolve(resolveDemoUnitResource(unitId))
  }
  if (isDemoUnitId(unitId)) {
    return Promise.resolve(buildDemoUnitResource(unitId))
  }
  return new Promise(resolve => {
    util.request('GET', '/mini-app/unit-words', {
      data: {
        unitId
      }
    }, (data) => {
      resolve(Array.isArray(data) && data.length ? data : buildDemoUnitResource(unitId))
    }, () => {
      resolve(buildDemoUnitResource(unitId))
    })
  })
}

function deleteRecord(resBookId) {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/delete-learning-record', {
      data: {
        resBookId
      }
    }, (data) => {
      resolve(data)
    })
  })
}

function getBookProucts(resBookId) {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/book-product-list', {
      data: {
        resBookId
      }
    }, (data) => {
      resolve(data)
    })
  })
}

function getOrder(orderProductId) {
    return new Promise(resolve => {
      util.request('GET', '/mini-app/order', {
        data: {
            orderProductId
        }
      }, (data) => {
        resolve(data)
      })
    })
  }

function reportListeningQuizResult(payload) {
  return new Promise(resolve => {
    util.request('POST', '/mini-app/listening-quiz-result', {
      data: payload
    }, () => {
      resolve(true)
    }, () => {
      resolve(false)
    })
  })
}

// 上报订阅消息授权和事件消息数据，供后端累计一次性订阅额度并发送事件通知。
// payload 形如 { tmplId, delta, total, messageData }。
const SUBSCRIBE_REPORT_URL = '/mini-app/subscribe-message/report' // TODO: 与后端确认实际路径
const SUBSCRIBE_REPORT_ENABLED = true

function reportSubscribeMessageQuota(payload) {
  if (!SUBSCRIBE_REPORT_ENABLED) {
    return Promise.resolve(false)
  }
  return new Promise(resolve => {
    util.request('POST', SUBSCRIBE_REPORT_URL, {
      data: payload
    }, () => {
      resolve(true)
    }, () => {
      resolve(false)
    })
  })
}

module.exports = {
  fetchMembership,
  getInviteSummary,
  validateInviteCode,
  bindInviteCode,
  getInviteQrcode,
  saveUserInfo,
  bindPhoneNumber,
  getUserInfo,
  getUserBooks,
  search,
  getWordInfo,
  getSentence,
  toggleBook,
  getUnits,
  saveRecord,
  getUnitWords,
  getUnitResource,
  deleteRecord,
  getBookProucts,
  getOrder,
  reportWordMark,
  reportRecitationScore,
  reportListeningQuizResult,
  reportSubscribeMessageQuota
}
