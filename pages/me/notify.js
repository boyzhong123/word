function getSubscribeTemplateIds() {
  const app = getApp()
  return (app.globalData && app.globalData.subscribeTmplIds) || []
}

function formatSubscribeStatus(value) {
  if (value === 'accept') {
    return '已允许'
  }
  if (value === 'reject') {
    return '已关闭'
  }
  if (value === 'ban') {
    return '系统禁止'
  }
  return '未设置'
}

Page({
  data: {
    tmplIds: [],
    statusText: '未设置',
    mainSwitchText: '未开启',
    hasTemplates: false
  },

  onLoad() {
    this.setData({
      tmplIds: getSubscribeTemplateIds(),
      hasTemplates: getSubscribeTemplateIds().length > 0
    })
    this.loadSetting()
  },

  onShow() {
    this.loadSetting()
  },

  loadSetting() {
    if (typeof wx.getSetting !== 'function') {
      return
    }
    wx.getSetting({
      withSubscriptions: true,
      success: res => {
        const subscriptions = res.subscriptionsSetting || {}
        const itemSettings = subscriptions.itemSettings || {}
        const ids = this.data.tmplIds || []
        const accepted = ids.some(id => itemSettings[id] === 'accept')
        const rejected = ids.some(id => itemSettings[id] === 'reject' || itemSettings[id] === 'ban')
        this.setData({
          mainSwitchText: subscriptions.mainSwitch ? '已开启' : '未开启',
          statusText: accepted ? '已允许' : (rejected ? '已关闭' : '未设置')
        })
      }
    })
  },

  requestSubscribe() {
    const tmplIds = this.data.tmplIds || []
    if (!tmplIds.length) {
      wx.showToast({ title: '暂无可订阅的消息模板', icon: 'none' })
      return
    }
    wx.requestSubscribeMessage({
      tmplIds,
      complete: res => {
        const accepted = tmplIds.some(id => res[id] === 'accept')
        const rejected = tmplIds.some(id => res[id] === 'reject' || res[id] === 'ban')
        this.setData({
          statusText: accepted ? '已允许' : (rejected ? '已关闭' : formatSubscribeStatus(res[tmplIds[0]]))
        })
        wx.showToast({
          title: accepted ? '已开启提醒' : '未开启提醒',
          icon: accepted ? 'success' : 'none'
        })
      }
    })
  },

  openSetting() {
    if (typeof wx.openSetting === 'function') {
      wx.openSetting({ complete: () => this.loadSetting() })
    }
  },

  onOfficialAccountLoad() {
    console.log('[me/notify] official account loaded')
  },

  onOfficialAccountError(event) {
    console.log('[me/notify] official account error', event.detail)
  }
})
