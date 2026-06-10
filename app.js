const baseUrl = wx.getAccountInfoSync().miniProgram.envVersion === 'release' ? 'https://pb10.91tszx.com' : 'https://pb10.91tszx.com'
App({
  onLaunch() {
    wx.setInnerAudioOption({
        obeyMuteSwitch: false,
        success: () => {
            console.log('开启静音模式下播放音乐的功能')
        },
        fail: () => {
            console.log('静音设置失败')
        }
    })
    // 监听网络变化
    wx.onNetworkStatusChange((params) => {
      const {
        isConnected,
        networkType
      } = params
      wx.setStorageSync('networkType', networkType)
      const prevConnectedStatus = wx.getStorageSync('isConnected')

      if (!isConnected || networkType === 'none') {
        if (prevConnectedStatus) {
          wx.showToast({
            title: '网络断开',
            icon: 'none',
            complete() {
              wx.setStorageSync('isConnected', false)
            }
          })
        }
      } else {
        if (!prevConnectedStatus) {
          wx.showToast({
            title: '网络已连接',
            icon: 'none',
            complete() {
              wx.setStorageSync('isConnected', true)
            }
          })
        }
      }
    })
    const { statusBarHeight, platform, windowWidth, windowHeight, safeArea } = wx.getSystemInfoSync()
    const { top, height } = wx.getMenuButtonBoundingClientRect()
    // 状态栏高度
    wx.setStorageSync('statusBarHeight', statusBarHeight)
    // 胶囊按钮高度 一般是32 如果获取不到就使用32
    wx.setStorageSync('menuButtonHeight', height ? height : 32)
    // 窗口宽度
    wx.setStorageSync('windowWidth', windowWidth)
    // 窗口高度
    wx.setStorageSync('windowHeight', windowHeight)
    // 安全区高度
    wx.setStorageSync('safeArea', safeArea)
    // 判断胶囊按钮信息是否成功获取
    if (top && top !== 0 && height && height !== 0) {
      const navigationBarHeight = (top - statusBarHeight) * 2 + height
      // 导航栏高度
      wx.setStorageSync('navigationBarHeight', navigationBarHeight)
    } else {
      wx.setStorageSync(
        'navigationBarHeight',
        platform === 'android' ? 48 : 40
      )
    }
  },
  globalData: {
    book: {},
    BASE_URL: baseUrl,
    token: ''
  }
})
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
