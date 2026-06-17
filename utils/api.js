const util = require('./util')

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
    const requestBind = (url, allowFallback) => {
      util.request('POST', url, { data: payload }, (data) => {
        resolve(data)
      }, (status, data, message) => {
        if (allowFallback && status === 404) {
          requestBind('/mini-app/user/info-update', false)
          return
        }
        reject(buildPhoneBindError(status, data, message))
      })
    }
    requestBind('/mini-app/user/phone-number', true)
  })
}

function getUserBooks() {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/user-books', {}, (data) => {
      resolve(data)
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

function getUnits(resBookId, page = 1, rows = 2000) {
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

function saveRecord(unitId) {
  return new Promise(resolve => {
    util.request('GET', '/mini-app/save-learning-record', {
      data: {
        unitId
      }
    }, (data) => {
      resolve(data)
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
  return new Promise(resolve => {
    util.request('GET', '/mini-app/unit-words', {
      data: {
        unitId
      }
    }, (data) => {
      resolve(data)
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

// 预留：上报订阅消息的订阅次数，供后端累计一次性订阅的推送额度。
// payload 形如 { tmplId, delta, total }。后端就绪后，把 URL 与后端确认、
// 并将 ENABLED 置为 true 即可联通；在此之前直接返回 false，
// 前端本地计数照常工作，不会发出无效请求。
const SUBSCRIBE_REPORT_URL = '/mini-app/subscribe-message/report' // TODO: 与后端确认实际路径
const SUBSCRIBE_REPORT_ENABLED = false

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
  reportListeningQuizResult,
  reportSubscribeMessageQuota
}
