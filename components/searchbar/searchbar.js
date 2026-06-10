const { search } = require('../../utils/api')

Component({
  properties: {},
  data: {
    value: ''
  },
  methods: {
    onInput(e) {
      this.setData({ value: e.detail.value })
    },
    onConfirm(e) {
      const value = (e.detail.value || this.data.value || '').trim()
      if (!value) {
        return
      }
      search(value).then((res) => {
        if (!res || !res.length) {
          wx.showToast({ title: '未找到相关内容', icon: 'none' })
          return
        }
        const item = res[0]
        wx.navigateTo({
          url: '/pages/practice/practice?from=search&resBookId=' + item.resBookId + '&unitId=' + item.unitId + '&wordId=' + item.wordId
        })
      }).catch(() => {
        wx.showToast({ title: '搜索失败', icon: 'none' })
      })
    },
    onClear() {
      this.setData({ value: '' })
    }
  }
})
