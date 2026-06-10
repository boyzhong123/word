const samplingSize = 64
const offsetSpeed = 290
const pathFuncs = [0.6, 0.25, 0.1, -0.1]

Component({
  lifetimes: {
    ready() {
      // 录音层由 wx:if 挂载，首帧布局可能未完成，延迟初始化更稳
      this.startInit()
    },
    detached() {
      this.stopAnimation()
      this.clearInitTimer()
    }
  },
  methods: {
    restart() {
      this.stopAnimation()
      this.startInit()
    },
    // 单飞初始化：ready() 与 media 的 restartRecordingWave() 可能同时触发，
    // 这里始终只保留一个待执行的定时器，避免两条链路一起消耗重试次数把次数提前耗尽。
    startInit() {
      this.clearInitTimer()
      this.initRetries = 0
      this.initTimer = setTimeout(() => this.initCanvas(), 32)
    },
    clearInitTimer() {
      if (this.initTimer) {
        clearTimeout(this.initTimer)
        this.initTimer = null
      }
    },
    stopAnimation() {
      if (this.canvas && this.requestID != null) {
        const cancel = this.canvas.cancelAnimationFrame || clearTimeout
        cancel(this.requestID)
      }
      this.canvas = null
      this.requestID = null
    },
    getWindowMetrics() {
      const sys = (wx.getWindowInfo && wx.getWindowInfo()) || wx.getSystemInfoSync()
      const windowWidth = sys.windowWidth || 375
      const ratio = windowWidth / 750
      return {
        windowWidth,
        fallbackWidth: Math.floor(windowWidth * 0.82),
        fallbackHeight: Math.max(Math.floor(106 * ratio), 48)
      }
    },
    initCanvas() {
      const dpr = ((wx.getWindowInfo && wx.getWindowInfo()) || wx.getSystemInfoSync()).pixelRatio || 2
      const metrics = this.getWindowMetrics()
      this.createSelectorQuery()
        .in(this)
        .select('#my-canvas')
        .fields({
          node: true,
          size: true
        })
        .exec(res => {
          if (!res || !res[0] || !res[0].node) {
            this.scheduleRetry()
            return
          }

          const canvas = res[0].node
          let width = res[0].width
          let height = res[0].height
          // 宿主刚挂载时布局可能还没完成（宽/高为 0）。
          // 此时先重试等待真实尺寸，宿主彻底拿不到尺寸时再用兜底值，
          // 避免把波形画在 0 尺寸画布上导致“看不见”。
          if (width <= 0 || height <= 0) {
            if (this.initRetries < 12) {
              this.scheduleRetry()
              return
            }
            if (width <= 0) {
              width = metrics.fallbackWidth
            }
            if (height <= 0) {
              height = metrics.fallbackHeight
            }
          }
          if (width <= 0 || height <= 0) {
            this.scheduleRetry()
            return
          }

          this.canvas = canvas
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            this.scheduleRetry()
            return
          }

          canvas.width = width * dpr
          canvas.height = height * dpr
          ctx.scale(dpr, dpr)

          const startTime = Date.now()
          const amplitude = height / 2
          const gap = width / samplingSize
          const samplingX = []
          const mapX = []
          for (let i = 0; i <= samplingSize; i++) {
            samplingX[i] = i * gap
            mapX[i] = (samplingX[i] / width) * 4 - 2
          }

          const requestFrame = canvas.requestAnimationFrame
            ? canvas.requestAnimationFrame.bind(canvas)
            : cb => setTimeout(cb, 16)

          const draw = () => {
            const offset = (Date.now() - startTime) / offsetSpeed
            ctx.clearRect(0, 0, width, height)
            for (let index = 3; index >= 0; index--) {
              if (index === 0) {
                ctx.lineWidth = 3
                ctx.strokeStyle = 'rgb(47,128,237)'
              } else {
                ctx.lineWidth = 1
                ctx.strokeStyle = 'rgb(159,195,245)'
              }
              samplingX.forEach((item, i) => {
                const realY = amplitude * this.calcValue(mapX[i], offset) * pathFuncs[index] * 80 * 0.01
                if (i === 0) {
                  ctx.beginPath()
                  ctx.moveTo(item, amplitude + realY)
                } else {
                  ctx.lineTo(item, amplitude + realY)
                }
              })
              ctx.stroke()
            }
            this.requestID = requestFrame(draw)
          }
          draw()
        })
    },
    scheduleRetry() {
      // 列表/随身听等较重的页面里 canvas 节点可能要更久才可查询，放宽到约 4s
      if (this.initRetries >= 60) {
        return
      }
      this.initRetries += 1
      this.clearInitTimer()
      this.initTimer = setTimeout(() => this.initCanvas(), 64)
    },
    calcValue(mapX, offset) {
      offset %= 2
      const sinFunc = Math.sin(Math.PI * mapX - offset * Math.PI)
      return sinFunc * 4 / (4 + Math.pow(mapX, 4))
    }
  }
})
