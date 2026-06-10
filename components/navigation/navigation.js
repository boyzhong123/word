// components/navigationBar/navigationBar.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    backInner: {
      type: Boolean,
      value: true
    },
    white: {
      type: Boolean,
      value: false
    },
    background: {
      type: String,
      value: '#ffffff'
    },
    backIcon: {
      type: String,
      value: 'icon_back_deep.svg'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 状态栏高度
    statusBarHeight: wx.getStorageSync('statusBarHeight') + 'px',
    // 导航栏高度
    navigationBarHeight: wx.getStorageSync('navigationBarHeight') + 'px',
    // 胶囊按钮高度
    menuButtonHeight: wx.getStorageSync('menuButtonHeight') + 'px',
    // 导航栏和状态栏高度
    navigationBarAndStatusBarHeight: wx.getStorageSync('statusBarHeight') + wx.getStorageSync('navigationBarHeight') + 'px',
    home: false
  },

  lifetimes: {
    attached() {
      this.setData({
        home: getCurrentPages().length == 1
      })
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    back() {
      if (this.data.home) {
        wx.switchTab({
          url: '/pages/home/home',
        })
      } else if (this.data.backInner) {
        wx.navigateBack()
      } else {
        this.triggerEvent("back", {})
      }
    }
  }
})
