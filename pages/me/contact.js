Page({
  data: {
    faqs: [
      {
        q: '学习记录没有同步怎么办？',
        a: '请先确认已登录同一微信账号，并下拉刷新首页后再查看。'
      },
      {
        q: '订阅提醒收不到怎么办？',
        a: '可以在“消息授权状态”中重新开启订阅消息和微信授权。'
      },
      {
        q: '教材切换后进度会丢失吗？',
        a: '不会。每本教材的学习记录会单独保存，切回后继续学习。'
      }
    ]
  },

  onContact(event) {
    console.log('[me/contact] service contact', event.detail)
  },

  openNotify() {
    wx.navigateTo({ url: '/pages/me/notify' })
  }
})
