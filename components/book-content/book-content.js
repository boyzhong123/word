Component({
  properties: {
    title: String,
    tip: String,
    words: {
      type: Array,
      value: []
    }
  },
  methods: {
    hidePopup() {
      this.triggerEvent('dismiss')
    },
    clickDialog() {},
    goStudy() {
      this.triggerEvent('goStudy')
    }
  }
})
