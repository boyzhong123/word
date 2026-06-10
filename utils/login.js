const { BASE_URL } = getApp().globalData

function setToken(token) {
  wx.setStorageSync('token', token)
  getApp().globalData.token = token
}

async function wxLogin(x_wx_encrypted_data, x_wx_iv) {
  return new Promise((resolve) => {
    console.log('[request] wx.login')
    wx.login({
      success(res) {
        const { code, errMsg } = res
        if (code) {
          console.log('[request] wx.login', code)
          wx.request({
            url: BASE_URL + '/mini-app/login',
            method: 'POST',
            data: {
              code: code
            },
            async success(res) {
              console.log('[request] getAccessToken', res)
              const { status, message, data } = res.data
              if (message === '首次登陆，缺少参数') {
                resolve({})
              } else {
                setToken(data.token) 
                resolve({
                  logined: true
                })
              }
            },
          })
        } else {
          wx.showToast({
            title: '登录失败：' + errMsg,
            icon: 'none',
          })
        }
      },
    })
  })
}

async function login(userInfo) {
  let x_wx_encrypted_data = ''
  let x_wx_iv = ''

  if (userInfo) {
    x_wx_encrypted_data = userInfo.encryptedData
    x_wx_iv = userInfo.iv
  }

  return new Promise(async (resolve) => {
    const token = wx.getStorageSync('token')
    console.log('token', token)
    if (token) {
      wx.checkSession({
        success: async () => {
          console.log('session 未过期')
          setToken(token)
          resolve({
            logined: true
          })
        },
        fail: async () => {
          console.log('session 已过期')
          resolve(await wxLogin(x_wx_encrypted_data, x_wx_iv))
        },
      })
    } else {
      resolve(await wxLogin(x_wx_encrypted_data, x_wx_iv))
    }
  })
}

module.exports = {
  login
}
