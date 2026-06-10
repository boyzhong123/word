// components/dialog/general/general-dialog.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    dialog: {
      type: Object,
      value: {}
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    onCancel() {
      this.setData({
        'dialog.type': ''
      })
    },
    onConfirm() {
      this.setData({
        'dialog.type': ''
      })
      if (this.data.dialog.confirm) {
        this.data.dialog.confirm()
      }
    }
  }
})