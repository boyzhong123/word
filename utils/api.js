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
