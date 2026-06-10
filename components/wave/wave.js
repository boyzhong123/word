const samplingSize = 64
const offsetSpeed = 290
const pathFuncs = [0.6, 0.25, 0.1, -0.1]

// 采用旧版 canvas 接口（canvas-id + wx.createCanvasContext）。
// 相比 type="2d" 的节点接口，旧接口不需要异步拿到 canvas 节点，
// 录音浮层由 wx:if 动态挂载时也能稳定绘制，避免“波浪线不显示”。
Component({
  lifetimes: {
    ready() {
      this.startInit()
    },
    detached() {
      this.stop()
    }
  },
  methods: {
    restart() {
      this.stop()
      this.startInit()
    },
    startInit() {
      this.stop()
      this.measureRetries = 0
      // 首帧布局可能未完成，延迟测量更稳
      this.measureTimer = setTimeout(() => this.measure(), 32)
    },
    stop() {
      this.running = false
      if (this.measureTimer) {
        clearTimeout(this.measureTimer)
        this.measureTimer = null
      }
      if (this.frameTimer) {
        clearTimeout(this.frameTimer)
        this.frameTimer = null
      }
    },
    measure() {
      this.measureTimer = null
      this.createSelectorQuery()
        .in(this)
        .select('.wave-canvas')
        .boundingClientRect(rect => {
          if (!rect || !rect.width || !rect.height) {
            // 布局还没好，重试等待真实尺寸（约 4s 上限）
            if (this.measureRetries < 60) {
              this.measureRetries += 1
              this.measureTimer = setTimeout(() => this.measure(), 64)
            }
            return
          }
          this.width = rect.width
          this.height = rect.height
          this.ctx = wx.createCanvasContext('waveCanvas', this)
          this.startTime = Date.now()
          this.running = true
          this.loop()
        })
        .exec()
    },
    loop() {
      if (!this.running || !this.ctx) {
        return
      }
      this.drawFrame()
      this.frameTimer = setTimeout(() => this.loop(), 16)
    },
    drawFrame() {
      const ctx = this.ctx
      const width = this.width
      const height = this.height
      const amplitude = height / 2
      const gap = width / samplingSize
      const offset = (Date.now() - this.startTime) / offsetSpeed
      // ctx.draw() 默认会先清空画布，无需手动 clearRect
      for (let index = 3; index >= 0; index--) {
        if (index === 0) {
          ctx.setLineWidth(3)
          ctx.setStrokeStyle('rgb(47,128,237)')
        } else {
          ctx.setLineWidth(1)
          ctx.setStrokeStyle('rgb(159,195,245)')
        }
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
      ctx.draw()
    },
    calcValue(mapX, offset) {
      offset %= 2
      const sinFunc = Math.sin(Math.PI * mapX - offset * Math.PI)
      return sinFunc * 4 / (4 + Math.pow(mapX, 4))
    }
  }
})
