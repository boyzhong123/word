Page({
  data: {
    src: ''
  },

  onLoad(options) {
    if (options && options.url) {
      this.setData({
        src: decodeURIComponent(options.url)
      })
    }
  }
})
