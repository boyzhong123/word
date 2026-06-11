const login = require('./login')
const global = getApp().globalData
const { BASE_URL} = global

function getNetworkType() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: ({ networkType }) => {
        resolve(networkType)
      },
    })
  })
}

const request = async (method, url, params, callback, reject, needDecode) => {
  const networkType = await getNetworkType()
  if (networkType !== 'none') {
    const token = getApp().globalData.token
    const req = wx.request({
      url: url.match(/^http/) ? url : BASE_URL + url,
      method,
      ...Object.assign({}, params, {
        header: Object.assign({}, params.header, {
          'token': token,
          'Content-type': 'application/json',
        }),
      }),
      async success(res) {
        clearTimeout(timeout)
        console.log('[request] ' + url, res)
        if (res.statusCode != 200) {
          if (typeof reject === 'function') {
            reject(res.statusCode, res.data)
          } else {
            wx.showToast({
              title: "error:" + res.statusCode,
              icon: 'none',
            })
          }
          return
        }
        const _res = res.data
        const { status, message, data, code } = _res

        // 401 未授权
        if (status === 'success') {
          callback(data, status, message)
        } else if (code === 401) {
          // 登录超时
          await login()
          request(method, url, params, callback, reject, needDecode)
        } else {
          if (typeof reject === 'function') {
            reject(status, data, message)
          } else {
            wx.showToast({
              title: message,
              icon: 'none',
            })
          }
        }
      }
    })

    const timeout = setTimeout(() => {
      req.abort()
      wx.showModal({
        title: '请求超时',
        content: '网络请求超时，请稍后再试！',
        showCancel: false,
        confirmText: '知道了',
      })
      reject('timeout')
    }, 10000)
  } else {
    wx.showToast({
      title: '您的网络好像不太给力，请稍后重试！',
      icon: 'none',
    })
    reject('noNetwork')
  }
}

const log = (module, content) => {
  return
  request(
    'POST',
    '/api/parentWxapp/member/oplog',
    {
      data: {
        module,
        content,
      },
    },
    (data, status, info) => {
      if (status !== 1) {
        console.log('oplog message: ' + info)
      }
    }
  )
}

const upload = (filePath) => {
  return new Promise((resolve) => {
    const token = getApp().globalData.token
    wx.uploadFile({
      url: BASE_URL + '/mini-app/upload-avatar',
      filePath,
      name: 'avatar',
      header: {
        token: token
      },
      success({ data }) {
        resolve(data)
      },
      fail({ errMsg }) {
        console.log(filePath + ' 上传失败')
        resolve()
      },
    })
  })
}

/**
 * 友盟埋点
 */
const track = (eventId, param = {}) => {
  const userInfo = global.userInfo || wx.getStorageSync('userInfo')
  const student = wx.getStorageSync('student') || {
    vip: {
      isExpired: 1,
    },
  }
  const attr = Object.assign(
    {},
    userInfo,
    {
      studentGender: student.gender,
      sutdentVip: student.vip.isExpired === 1 ? 0 : 1,
    },
    param
  )
  console.log('[track]', eventId, attr)
  wx.uma.trackEvent(eventId, attr)
}

/**
 * 获取当前页完整url
 */
const getFullUrl = (arg) => {
  var pages = getCurrentPages() //获取加载的页面
  var currentPage = pages[pages.length - 1] //获取当前页面的对象
  var url = '/' + currentPage.route //当前页面url
  var options = currentPage.options //如果要获取url中所带的参数可以查看options

  if (arg) {
    var urlWithArgs = url + '?'
    for (var key in options) {
      var value = options[key]
      urlWithArgs += key + '=' + value + '&'
    }
    urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length - 1)
    return urlWithArgs
  } else {
    return url
  }
}

const compareVersion = (v1, v2) => {
    v1 = v1.split('.')
    v2 = v2.split('.')
    const len = Math.max(v1.length, v2.length)
    while (v1.length < len) {
        v1.push('0')
    }
    while (v2.length < len) {
        v2.push('0')
    }
    for (let i = 0; i < len; i++) {
        const num1 = parseInt(v1[i])
        const num2 = parseInt(v2[i])
        if (num1 > num2) {
            return 1
        } else if (num1 < num2) {
            return -1
        }
    }
    return 0
}

const canUseUserProfile = () => {
  //wx.getAppBaseInfo() 大于2.20.1有效，否则报错
  try {
    return compareVersion(wx.getAppBaseInfo().SDKVersion, '2.27.1') <= 0
  } catch (e) {
    return false
  }
}

const refreshHomePage = () => {
    var pages = getCurrentPages() //获取加载的页面
    for (let i = 0; i < pages.length; i++) {
        pages[i].route == 'pages/home/home'
        pages[i].refresh = true
        break
    }
}

module.exports = {
  // 下面是以前的接口
  request,
  upload,
  log,
  track,
  getFullUrl,
  canUseUserProfile,
  refreshHomePage
}
