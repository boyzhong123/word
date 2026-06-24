Page({
  data: {
    src: ''
  },

  onLoad(options) {
    if (options && options.title) {
      wx.setNavigationBarTitle({
        title: decodeURIComponent(options.title)
      })
    }
    if (options && options.url) {
      this.setData({
        src: decodeURIComponent(options.url)
      })
    }
  }
})
