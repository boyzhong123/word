const baseUrl = wx.getAccountInfoSync().miniProgram.envVersion === 'release' ? 'https://pb10.91tszx.com' : 'https://pb10.91tszx.com'

function updateNetworkStatus(networkType) {
  const isConnected = networkType !== 'none'
  wx.setStorageSync('networkType', networkType)
  wx.setStorageSync('isConnected', isConnected)
  return isConnected
}

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
    wx.getNetworkType({
      success: ({ networkType }) => {
        updateNetworkStatus(networkType)
      }
    })
    // 监听网络变化
    wx.onNetworkStatusChange((params) => {
      const {
        isConnected,
        networkType
      } = params
      const prevConnectedStatus = wx.getStorageSync('isConnected')
      updateNetworkStatus(networkType)

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
