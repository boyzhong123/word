const {
  samplingSize,
  offsetSpeed,
  pathFuncs,
  calcValue: waveCalcValue
} = require('../../utils/recording-wave-math')
const waveDebug = require('../../utils/recording-wave-debug')

function isDevtools() {
  try {
    return wx.getSystemInfoSync().platform === 'devtools'
  } catch (e) {
    return false
  }
}

const INIT_DELAY_MS = isDevtools() ? 48 : 120

Component({
  data: {
    canvasReady: false
  },
  lifetimes: {
    ready() {
      waveDebug.log('wave.ready')
      this._loggedLoop = false
      this.remountCanvas(() => this.startInit())
    },
    detached() {
      waveDebug.log('wave.detached', { running: !!this.running })
      this.stop()
      this.data.canvasReady = false
    }
  },
  methods: {
    restart() {
      waveDebug.log('wave.restart')
      this._loggedLoop = false
      this.stop()
      this.remountCanvas(() => this.startInit())
    },
    remountCanvas(done) {
      const finish = typeof done === 'function' ? done : function () {}
      waveDebug.log('wave.remount.begin', { canvasReady: this.data.canvasReady })
      if (this.data.canvasReady) {
        this.setData({ canvasReady: false }, () => {
          wx.nextTick(() => {
            this.setData({ canvasReady: true }, () => {
              waveDebug.log('wave.remount.done')
              setTimeout(finish, INIT_DELAY_MS)
            })
          })
        })
        return
      }
      this.setData({ canvasReady: true }, () => {
        waveDebug.log('wave.remount.done')
        setTimeout(finish, INIT_DELAY_MS)
      })
    },
    startInit() {
      this.stop()
      this.measureRetries = 0
      waveDebug.log('wave.startInit', { delayMs: INIT_DELAY_MS })
      this.measureTimer = setTimeout(() => this.measure(), INIT_DELAY_MS)
    },
    stop() {
      this.running = false
      const canvas = this.canvas
      if (this.rafId != null && this.canvas && this.canvas.cancelAnimationFrame) {
        canvas.cancelAnimationFrame(this.rafId)
      }
      this.rafId = null
      if (this.measureTimer) {
        clearTimeout(this.measureTimer)
        this.measureTimer = null
      }
      if (this.frameTimer) {
        clearTimeout(this.frameTimer)
        this.frameTimer = null
      }
      this.canvas = null
      this.ctx = null
    },
    measure() {
      this.measureTimer = null
      if (!this.data.canvasReady) {
        this.retryMeasure('canvasNotReady')
        return
      }
      this.createSelectorQuery()
        .in(this)
        .select('.wave-canvas')
        .fields({ node: true, size: true })
        .exec(res => {
          const info = res && res[0]
          const node = info && info.node
          if (!node) {
            this.retryMeasure('noNode')
            return
          }
          let width = info.width
          let height = info.height
          if (!width || !height) {
            this.retryMeasure('zeroSize', { width, height })
            return
          }
          const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) ||
            wx.getSystemInfoSync().pixelRatio || 2
          node.width = width * dpr
          node.height = height * dpr
          const ctx = node.getContext('2d')
          if (!ctx) {
            this.retryMeasure('noContext')
            return
          }
          ctx.scale(dpr, dpr)
          this.canvas = node
          this.ctx = ctx
          this.width = width
          this.height = height
          this.startTime = Date.now()
          this.running = true
          waveDebug.log('wave.measure.ok', { width, height, dpr, retry: this.measureRetries })
          this.loop()
        })
    },
    retryMeasure(reason, extra) {
      waveDebug.log('wave.measure.retry', Object.assign({ reason, retry: this.measureRetries }, extra || {}))
      if (this.measureRetries < 60) {
        this.measureRetries += 1
        this.measureTimer = setTimeout(() => this.measure(), 64)
        return
      }
      waveDebug.log('wave.measure.giveUp', { reason, retries: this.measureRetries })
    },
    loop() {
      if (!this.running || !this.ctx) {
        return
      }
      if (!this._loggedLoop) {
        this._loggedLoop = true
        waveDebug.log('wave.loop.start')
      }
      this.drawFrame()
      const canvas = this.canvas
      const raf = canvas && canvas.requestAnimationFrame
      if (typeof raf === 'function') {
        this.rafId = raf.call(canvas, () => this.loop())
      } else {
        this.frameTimer = setTimeout(() => this.loop(), 32)
      }
    },
    drawFrame() {
      const ctx = this.ctx
      const width = this.width
      const height = this.height
      const amplitude = height / 2
      const gap = width / samplingSize
      const offset = (Date.now() - this.startTime) / offsetSpeed
      ctx.clearRect(0, 0, width, height)
      for (let index = 3; index >= 0; index--) {
        ctx.lineWidth = index === 0 ? 3 : 1
        ctx.strokeStyle = index === 0 ? 'rgb(47,128,237)' : 'rgb(159,195,245)'
        ctx.beginPath()
        for (let i = 0; i <= samplingSize; i++) {
          const x = i * gap
          const mapX = (x / width) * 4 - 2
          const realY = amplitude * this.calcValue(mapX, offset) * pathFuncs[index] * 80 * 0.01
          if (i === 0) {
            ctx.moveTo(x, amplitude + realY)
          } else {
            ctx.lineTo(x, amplitude + realY)
          }
        }
        ctx.stroke()
      }
    },
    calcValue(mapX, offset) {
      return waveCalcValue(mapX, offset)
    }
  }
})
