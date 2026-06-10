const {
    getUnits,
    getUnitWords
} = require('../../utils/api')
const {
    refreshHomePage
} = require('../../utils/util')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isVip: true,
    selectedIndex: 0,
    dialog: { type: '' },
    pages: [],
    contentDialog: { show: false },
    scrollHeight: wx.getSystemInfoSync().windowHeight - wx.getStorageSync('navigationBarHeight') - wx.getStorageSync('statusBarHeight')
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
      this.resBookId = options.resBookId
      this.unitId = options.unitId
      this.resBookName = options.name
      this.fetchData()
  },
  fetchData() {
      getUnits(this.resBookId).then(data => {
          if (Array.isArray(data.list)) {
              data.list.forEach((item, index) => {
                  switch (index % 5) {
                      case 4:
                          item.style = "top:260rpx;left:431rpx;"
                          break
                      case 3:
                          item.style = "top:780rpx;left:431rpx;"
                          break
                      case 2:
                          item.style = "top:1300rpx;left:372rpx;"
                          break
                      case 1:
                          item.style = "top:1820rpx;left:331rpx;"
                          break
                      case 0:
                          item.style = "top:2340rpx;left:372rpx;bottom:200rpx;"
                          break
                  }
                  if (item.needVip) {
                      item.src = "https://17ks.chivoxapp.com/proverbs/catalogue_lock.png"
                      item.class = "icon-present"
                      item.color = '#00000000'
                  } else if (item.unitId == this.unitId) {
                      item.src = "https://17ks.chivoxapp.com/proverbs/catalogue_present.png"
                      item.class = "icon-present2"
                      item.color = '#FFFFFF'
                  } else if (item.completed) {
                      item.src = "https://17ks.chivoxapp.com/proverbs/catalogue_complete.png"
                      item.class = "icon-present"
                      item.color = '#FFFFFF'
                  } else {
                      item.src = "https://17ks.chivoxapp.com/proverbs/catalogue_not_start.png"
                      item.class = "icon-present"
                      item.color = '#B4B6BA'
                  }
              })
              let p = []
              for (let i = 0; i < Math.ceil(data.list.length / 5); i++) {
                  p[i] = {
                      units: data.list.slice(5 * i, 5 * i + 5)
                  }
              }
              this.setData({
                  pages: p.reverse(),
                  isVip: !data.list.some(item => item.needVip)
              })
          }
      })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    setTimeout(() => {
      this.setData({
        selectedIndex: this.unitId
      })
    }, 800)
  },

  showVipPopup() {
    let that = this
    this.setData({
      dialog: {
        type: 'vip',
        confirm: function () {
          that.goVip()
        }
      }
    })
  },

  longPress(e) {
    let index = e.currentTarget.dataset.index
    let unit = this.data.pages[Math.floor(index / 5)].units[index % 5]
    if (unit.needVip == 0) {
      this.selectUnitId = unit.unitId
      getUnitWords(unit.unitId).then(data => {
        data.forEach(item => {
          item.page = item.pages.join('-')
        })
        this.setData({
          contentDialog: {
            show: true,
            title: unit.unitName,
            tip: "共" + unit.wordTotal + "个单词，" + unit.proverbTotal + "个谚语",
            words: data
          }
        })
      })
    } else {
      this.showVipPopup()
    }
  },
  onItemClick(e) {
    let index = e.currentTarget.dataset.index
    let unit = this.data.pages[Math.floor(index / 5)].units[index % 5]
    if (unit.needVip == 1) {
      this.showVipPopup()
    } else {
      this.getOpenerEventChannel().emit('study', { resBookId: this.resBookId, unitId: unit.unitId })
      wx.navigateBack()
    }
  },
  goStudy() {
    this.dismiss()
    this.getOpenerEventChannel().emit('study', { resBookId: this.resBookId, unitId: this.selectUnitId })
    wx.navigateBack()
  },
  dismiss() {
    this.setData({
      'contentDialog.show': false
    })
  },
  goVip() {
      wx.navigateTo({
          url: '../vip/vip?resBookId=' + this.resBookId + '&name=' + this.resBookName,
          events: {
              'vip': () => {
                  refreshHomePage()
                  this.fetchData()
              }
          }
      })
  }
})
