const samplingSize = 64
const offsetSpeed = 290
const pathFuncs = [0.6, 0.25, 0.1, -0.1]

// 采用旧版 canvas 接口（canvas-id + wx.createCanvasContext）。
// 相比 type="2d" 的节点接口，旧接口不需要异步拿到 canvas 节点，
// 录音浮层由 wx:if 动态挂载时也能稳定绘制，避免“波浪线不显示”。
let waveCanvasSeq = 0

Component({
  data: {
    canvasId: 'waveCanvas'
  },
  lifetimes: {
    created() {
      // 每个实例用唯一 canvas-id。录音浮层 wx:if 反复销毁/重建 canvas 时，
      // 真机上旧 canvas 节点是异步销毁的，沿用固定 id 会让新实例的
      // createCanvasContext 绑定到已销毁的旧节点，draw() 画到“空”里——
      // 表现为第二、三次测评波浪线消失（模拟器同步销毁所以不复现）。
      waveCanvasSeq += 1
      this.setData({ canvasId: 'waveCanvas-' + Date.now() + '-' + waveCanvasSeq })
    },
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
      this.pendingNext = false
      if (this.measureTimer) {
        clearTimeout(this.measureTimer)
        this.measureTimer = null
      }
      if (this.frameTimer) {
        clearTimeout(this.frameTimer)
        this.frameTimer = null
      }
      if (this.watchdogTimer) {
        clearTimeout(this.watchdogTimer)
        this.watchdogTimer = null
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
          this.ctx = wx.createCanvasContext(this.data.canvasId, this)
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
      // 串行驱动：下一帧由 ctx.draw() 完成回调触发，绝不在上一帧提交前再发起绘制。
      // 真机上 draw() 是异步且开销大，固定 16ms 定时会让“清空-绘制”互相打断，
      // 偶尔露出被清空的空白帧（波浪线消失）。watchdog 兜底防止回调丢失导致永久空白。
      this.pendingNext = true
      const advance = () => {
        if (!this.pendingNext) {
          return
        }
        this.pendingNext = false
        if (this.frameTimer) {
          clearTimeout(this.frameTimer)
          this.frameTimer = null
        }
        if (this.watchdogTimer) {
          clearTimeout(this.watchdogTimer)
          this.watchdogTimer = null
        }
        if (this.running) {
          // ~30fps 足够顺滑，且进一步降低真机绘制压力
          this.frameTimer = setTimeout(() => this.loop(), 32)
        }
      }
      this.ctx.draw(false, advance)
      // 部分机型 draw 回调可能延迟/丢失，200ms 后兜底推进
      this.watchdogTimer = setTimeout(advance, 200)
    },
    drawFrame() {
      const ctx = this.ctx
      const width = this.width
      const height = this.height
      const amplitude = height / 2
      const gap = width / samplingSize
      const offset = (Date.now() - this.startTime) / offsetSpeed
      // 仅构建路径；ctx.draw() 由 loop() 带完成回调统一发起（默认会先清空画布）
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
    },
    calcValue(mapX, offset) {
      offset %= 2
      const sinFunc = Math.sin(Math.PI * mapX - offset * Math.PI)
      return sinFunc * 4 / (4 + Math.pow(mapX, 4))
    }
  }
})
