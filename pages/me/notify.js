const {
  getSubscribeTemplates,
  getSubscribePref,
  setSubscribePref,
  getSubscribeQuota,
  bumpSubscribeQuota
} = require('../../utils/subscribe')
const { reportSubscribeMessageQuota } = require('../../utils/api')

function buildTemplateView(item) {
  const isEvent = item.mode === 'event'
  const hasPref = !!item.prefKey
  const enabled = hasPref ? getSubscribePref(item.prefKey) : false
  const count = item.countKey ? getSubscribeQuota(item.countKey) : 0
  let statusText = '待授权'
  let statusType = 'off'
  if (hasPref && !enabled) {
    statusText = '已关闭'
  } else if (isEvent) {
    statusText = '已开启'
    statusType = 'on'
  } else if (count > 0) {
    statusText = '已累计'
    statusType = 'on'
  }
  return {
    id: item.id,
    title: item.title,
    desc: item.desc,
    when: item.when,
    previewFields: item.previewFields || [],
    mode: item.mode,
    isEvent,
    isAccumulate: item.mode === 'accumulate',
    hasPref,
    prefKey: item.prefKey || '',
    enabled,
    prefTitle: item.mode === 'accumulate' ? '提醒开关' : '提醒时机',
    prefDesc: item.mode === 'accumulate'
      ? (enabled ? '已开启，到打卡时间可使用累计次数提醒' : '提醒已关闭，累计次数会保留')
      : item.when,
    countKey: item.countKey,
    count,
    statusText,
    statusType
  }
}

Page({
  data: {
    templates: [],
    hasTemplates: false,
    mainSwitchText: '未开启',
    previewVisible: false,
    previewTemplate: null
  },

  onLoad() {
    this.refreshTemplates()
  },

  onShow() {
    this.refreshTemplates()
    this.loadSetting()
  },

  refreshTemplates() {
    const templates = getSubscribeTemplates().map(buildTemplateView)
    this.setData({
      templates,
      hasTemplates: templates.length > 0
    })
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
        const templates = this.data.templates.map(item => {
          if (item.isEvent) {
            return item
          }
          const setting = itemSettings[item.id]
          let statusText = item.enabled ? (item.count > 0 ? '已累计' : '待授权') : '已关闭'
          let statusType = item.enabled && item.count > 0 ? 'on' : 'off'
          if (setting === 'accept') {
            statusText = '已授权'
            statusType = 'on'
          } else if (setting === 'reject' || setting === 'ban') {
            statusText = '已关闭'
            statusType = 'off'
          }
          return Object.assign({}, item, { statusText, statusType })
        })
        this.setData({
          templates,
          mainSwitchText: subscriptions.mainSwitch ? '已开启' : '未开启'
        })
      }
    })
  },

  previewTemplate(event) {
    const dataset = (event && event.currentTarget && event.currentTarget.dataset) || {}
    const id = dataset.id
    const template = this.data.templates.find(item => item.id === id)
    if (!template) {
      return
    }
    this.setData({
      previewVisible: true,
      previewTemplate: template
    })
  },

  closePreview() {
    this.setData({
      previewVisible: false,
      previewTemplate: null
    })
  },

  toggleTemplatePref(event) {
    const dataset = (event && event.currentTarget && event.currentTarget.dataset) || {}
    const prefKey = dataset.prefKey
    const enabled = !!(event && event.detail && event.detail.value)
    if (!prefKey) {
      return
    }
    setSubscribePref(prefKey, enabled)
    const templates = this.data.templates.map(item => {
      if (item.prefKey !== prefKey) {
        return item
      }
      const statusText = item.isAccumulate
        ? (enabled ? (item.count > 0 ? '已累计' : '待授权') : '已关闭')
        : (enabled ? '已开启' : '已关闭')
      const statusType = enabled && (!item.isAccumulate || item.count > 0) ? 'on' : 'off'
      return Object.assign({}, item, {
        enabled,
        statusText,
        statusType,
        prefDesc: item.isAccumulate
          ? (enabled ? '已开启，到打卡时间可使用累计次数提醒' : '提醒已关闭，累计次数会保留')
          : item.when
      })
    })
    this.setData({ templates })
    wx.showToast({
      title: enabled ? '已开启提醒' : '已关闭提醒',
      icon: 'none'
    })
  },

  // 单个模板订阅：一次性订阅，每同意一次累计一次推送额度
  subscribeOne(event) {
    const dataset = (event && event.currentTarget && event.currentTarget.dataset) || {}
    const id = dataset.id
    const template = this.data.templates.find(item => item.id === id)
    if (!template) {
      return
    }
    if (typeof wx.requestSubscribeMessage !== 'function') {
      wx.showToast({ title: '当前微信版本不支持', icon: 'none' })
      return
    }
    wx.requestSubscribeMessage({
      tmplIds: [id],
      success: res => {
        if (res[id] === 'accept') {
          const count = bumpSubscribeQuota(template.countKey, 1)
          // 预留后端：上报订阅，后端据此累计推送额度（接口就绪前为空操作）
          reportSubscribeMessageQuota({ tmplId: id, delta: 1, total: count })
          this.updateTemplate(id, { count, statusText: '已授权', statusType: 'on' })
          wx.showToast({ title: '已累计 ' + count + ' 次提醒', icon: 'success' })
        } else if (res[id] === 'reject') {
          this.updateTemplate(id, { statusText: '已关闭', statusType: 'off' })
          wx.showToast({ title: '已拒绝该提醒', icon: 'none' })
        }
      },
      fail: error => {
        console.log('[me/notify] subscribe failed', error)
        wx.showModal({
          title: '提醒未能开启',
          content: '请在设置中允许「订阅消息」后再来累计提醒次数。',
          confirmText: '去设置',
          success: modalRes => {
            if (modalRes.confirm && typeof wx.openSetting === 'function') {
              wx.openSetting({ complete: () => this.loadSetting() })
            }
          }
        })
      }
    })
  },

  updateTemplate(id, patch) {
    const templates = this.data.templates.map(item => (
      item.id === id ? Object.assign({}, item, patch) : item
    ))
    this.setData({ templates })
  },

  openSetting() {
    if (typeof wx.openSetting === 'function') {
      wx.openSetting({ complete: () => this.loadSetting() })
    }
  },

  noop() {}
})
