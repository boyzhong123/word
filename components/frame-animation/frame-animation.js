Component({
  properties: {
    url: String,
    width: {
      type: Number,
      value: 0
    },
    height: {
      type: Number,
      value: 0
    },
    count: {
      type: Number,
      value: 1
    },
    duration: {
      type: Number,
      value: 0.5
    },
    playNumber: {
      type: String,
      value: 'infinite'
    },
    state: {
      type: String,
      value: 'running'
    }
  },
  data: {
    stateClass: 'running'
  },
  observers: {
    state(value) {
      this.setData({
        stateClass: value === 'paused' ? 'paused' : 'running'
      })
    }
  },
  lifetimes: {
    attached() {
      this.setData({
        stateClass: this.data.state === 'paused' ? 'paused' : 'running'
      })
      if (this.data.playNumber !== 'infinite') {
        const times = Number(this.data.playNumber)
        if (Number.isFinite(times) && times > 0) {
          const ms = Number(this.data.duration) * 1000 * times
          this._timer = setTimeout(() => {
            this.triggerEvent('end')
          }, ms)
        }
      }
    },
    detached() {
      if (this._timer) {
        clearTimeout(this._timer)
      }
    }
  }
})
