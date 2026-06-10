const util = require('./util')

function saveUserInfo(userInfo) {
  return new Promise(resolve => {
    util.request('POST', '/mini-app/user/info-update', { data: userInfo }, (data) => {
      resolve(data)
    })
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

module.exports = {
  saveUserInfo,
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
deleteRecord,
  getBookProucts,
  getOrder
}
