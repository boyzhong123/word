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
    frameStyle: ''
  },

  lifetimes: {
    attached() {
      this._frameIndex = 0
      this._loopsDone = 0
      this.applyFrame(0)
      this.startAnimation()
      this.scheduleEndEvent()
    },

    detached() {
      this.stopAnimation()
      if (this._endTimer) {
        clearTimeout(this._endTimer)
        this._endTimer = null
      }
    }
  },

  methods: {
    buildFrameStyle(frameIndex) {
      const width = Number(this.properties.width) || 0
      const height = Number(this.properties.height) || 0
      const count = Math.max(Number(this.properties.count) || 1, 1)
      const url = this.properties.url || ''
      const safeIndex = Math.max(0, Math.min(frameIndex, count - 1))

      return [
        'background-image:url(' + url + ')',
        'background-repeat:no-repeat',
        'background-size:' + (width * count) + 'rpx ' + height + 'rpx',
        'background-position:' + (-safeIndex * width) + 'rpx 0',
        'width:' + width + 'rpx',
        'height:' + height + 'rpx'
      ].join(';')
    },

    applyFrame(frameIndex) {
      this.setData({
        frameStyle: this.buildFrameStyle(frameIndex)
      })
    },

    stopAnimation() {
      if (this._frameTimer) {
        clearInterval(this._frameTimer)
        this._frameTimer = null
      }
    },

    scheduleEndEvent() {
      if (this._endTimer) {
        clearTimeout(this._endTimer)
        this._endTimer = null
      }
      if (this.properties.playNumber === 'infinite') {
        return
      }

      const times = Number(this.properties.playNumber)
      const duration = Number(this.properties.duration) || 0.5
      if (!Number.isFinite(times) || times <= 0) {
        return
      }

      this._endTimer = setTimeout(() => {
        this.triggerEvent('end')
      }, duration * 1000 * times)
    },

    startAnimation() {
      this.stopAnimation()
      const state = this.properties.state
      const count = Math.max(Number(this.properties.count) || 1, 1)
      const duration = Number(this.properties.duration) || 0.5
      if (state === 'paused' || count <= 1) {
        return
      }

      const frameMs = Math.max(33, (duration * 1000) / count)
      const maxLoops = this.properties.playNumber === 'infinite'
        ? Infinity
        : Number(this.properties.playNumber)

      this._frameTimer = setInterval(() => {
        this._frameIndex += 1
        if (this._frameIndex >= count) {
          this._frameIndex = 0
          this._loopsDone += 1
          if (Number.isFinite(maxLoops) && this._loopsDone >= maxLoops) {
            this.stopAnimation()
            this.triggerEvent('end')
            return
          }
        }
        this.applyFrame(this._frameIndex)
      }, frameMs)
    },

    restartAnimation() {
      this.stopAnimation()
      this._frameIndex = 0
      this._loopsDone = 0
      this.applyFrame(0)
      this.startAnimation()
      this.scheduleEndEvent()
    }
  }
})
