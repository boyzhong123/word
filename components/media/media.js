// components/meida/media.js
const aiengine = require('../../lib/ChivoxAiEngine.js')
const scoringSession = require('./scoring-session.js')

function createWsEngineSafe() {
  if (typeof aiengine.createWsEngine !== 'function') {
    console.warn('[media] ChivoxAiEngine.createWsEngine is unavailable')
    return null
  }
  return aiengine.createWsEngine({})
}

const wsEngine = createWsEngineSafe()
const recorderManager = wx.getRecorderManager()
const feedBackPlayer = wx.createInnerAudioContext({
  useWebAudioImplement: false
})
const IDLE = 0, AUDIO_PLAYING = 1, RECORDING = 2, REPLAYING = 3, MARKING = 4
const MARK_TIMEOUT_MS = 20000
const STOP_RESULT_TIMEOUT_MS = 15000
// 开发者工具的录音机实际产出 WebM（文件名伪装成 .mp3），驰声服务端解不了会
// 静默不回包，导致界面卡死"评分中..."。模拟器一律走模拟评分，真机走真实评测。
const IS_DEVTOOLS = (function () {
  try {
    return wx.getSystemInfoSync().platform === 'devtools'
  } catch (e) {
    return false
  }
})()
let engineBound = false
let recorderBound = false
let cachedSig = null
let sigPromise = null
var windowWidth = wx.getStorageSync('windowWidth')

function isValidSig(sig) {
  return !!(
    sig &&
    typeof sig.applicationId === 'string' &&
    typeof sig.sig === 'string' &&
    typeof sig.alg === 'string' &&
    typeof sig.userId === 'string'
  )
}

function handleEngineResultFor(target, res) {
  target.handleEngineResult(res)
}

function handleEngineErrorResultFor(target, res) {
  target.handleEngineErrorResult(res)
}

function handleRecorderStartFor(target) {
  target.recorderStart = true
  console.log('recorderManager onStart')
}

function handleRecorderStopFor(target, res) {
  target.recorderStart = false
  console.log('recorderManager onStop')
  if (target.data.media_state == RECORDING) {
    target.data._temp_file_path = res.tempFilePath
    scoringSession.beginScoring(target)
    if (target.devtoolsMock) {
      target.setData({ media_state: MARKING })
      target.startMarkWatchdog()
      setTimeout(() => {
        if (target.data.media_state != MARKING) {
          return
        }
        const overall = 60 + Math.floor(Math.random() * 36)
        console.warn('[media] 开发者工具不支持驰声评测（录音为 WebM），返回模拟分 ' + overall + '，真实评分请用真机调试')
        target.handleEngineResult({ result: { overall, details: [] } })
      }, 700)
      return
    }
    wsEngine.stop({
      timeout: STOP_RESULT_TIMEOUT_MS,
      success: () => {
        scoringSession.beginScoring(target)
        target.setData({
          media_state: MARKING
        })
        target.startMarkWatchdog()
        console.log('====== wsEngine stop success ======')
      },
      fail: (res) => {
        console.log('====== wsEngine stop fail ======')
        console.log(res)
        target.resetMarkingState('评分失败，请重试')
      },
      complete: () => {
        console.log('====== wsEngine stop complete ======')
      }
    })
  }
}

function handleFrameRecordedFor(target, res) {
  if (target.devtoolsMock) {
    return
  }
  const { frameBuffer } = res
  if (frameBuffer && target.data.media_state == RECORDING) {
    console.log('frameBuffer.byteLength', frameBuffer.byteLength)
    wsEngine.feed({
      data: frameBuffer,
      success: () => {
        console.log('feed success.')
      },
      fail: (res) => {
        console.log('feed fail:', JSON.stringify(res))
      },
      complete: () => {}
    })
  }
}

function handleRecorderErrorFor(target, res) {
  console.log('recorder fail', res)
  target.resetMarkingState('录音失败，请重试')
}

// 录音会话开始时，把引擎与录音机的回调直接绑定到发起录音的实例。
// 结果回来时不再经过路由表，避免组件切换（展开另一句/进入下一题）后指针
// 过期导致评分结果丢失、界面卡在"评分中..."。
function claimSessionHandlers(media) {
  if (!wsEngine) {
    return
  }
  wsEngine.onResult(res => handleEngineResultFor(media, res))
  wsEngine.onErrorResult(res => handleEngineErrorResultFor(media, res))
  recorderManager.onStart(() => handleRecorderStartFor(media))
  recorderManager.onStop(res => handleRecorderStopFor(media, res))
  recorderManager.onFrameRecorded(res => handleFrameRecordedFor(media, res))
  recorderManager.onError(res => handleRecorderErrorFor(media, res))
}

function bindEngineEvents() {
  if (!wsEngine || engineBound) {
    return
  }
  engineBound = true
  wsEngine.onResult(res => {
    const target = scoringSession.routeMediaTarget()
    if (target) {
      target.handleEngineResult(res)
    } else {
      console.warn('[media] onResult with no active scorer', JSON.stringify(res))
    }
  })
  wsEngine.onErrorResult(res => {
    const target = scoringSession.routeMediaTarget()
    if (target) {
      target.handleEngineErrorResult(res)
    } else {
      console.warn('[media] onErrorResult with no active scorer', JSON.stringify(res))
    }
  })
}

function bindRecorderEvents() {
  if (recorderBound) {
    return
  }
  recorderBound = true
  recorderManager.onStart(() => {
    const target = scoringSession.routeMediaTarget()
    if (target) {
      handleRecorderStartFor(target)
    }
  })
  recorderManager.onStop((res) => {
    const target = scoringSession.routeMediaTarget()
    if (target) {
      handleRecorderStopFor(target, res)
    }
  })
  recorderManager.onInterruptionBegin((res) => {
    console.log('onInterruptionBegin', JSON.stringify(res))
  })
  recorderManager.onInterruptionEnd((res) => {
    console.log('onInterruptionEnd', JSON.stringify(res))
  })
  recorderManager.onFrameRecorded((res) => {
    const target = scoringSession.routeMediaTarget()
    if (target) {
      handleFrameRecordedFor(target, res)
    }
  })
  recorderManager.onError((res) => {
    const target = scoringSession.routeMediaTarget()
    if (target) {
      handleRecorderErrorFor(target, res)
    }
  })
}

bindEngineEvents()
bindRecorderEvents()

Component({
  options: {
    pureDataPattern: /^_/
  },
  properties: {
    _index: {
      type: Number,
      value: 0
    },
    _autoplay: {
      type: Boolean,
      value: false
    },
    _audio: {
      type: String,
      value: ''
    },
    _audioState: {
      type: String,
      value: 'running'
    },
    _refText: {
      type: String,
      value: ''
    },
    _coreType: {
      type: String,
      value: ''
    },
    _temp_file_path: {
      type: String,
      value: ''
    },
    score: {
      type: String,
      value: ''
    },
    _overlayRecord: {
      type: Boolean,
      value: false
    }
  },
  data: {
    _sig: {},
    media_state: IDLE,
    innerAudioContext: null
  },
  observers: {
    media_state: function (value) {
      this.triggerEvent('mediaStateChange', { state: value })
      if (value === RECORDING) {
        this.restartRecordingWave()
      }
    }
  },
  pageLifetimes: {
    show() {
      this.initSDK()
    },
    hide() {
      if (scoringSession.shouldProtectFromCancel(this)) {
        return
      }
      if (this.data.media_state === RECORDING) {
        this.stopRecording()
        return
      }
      this.cancel()
    }
  },
  lifetimes: {
    created() {
      scoringSession.setFallbackMedia(this)
      this.animation = wx.createAnimation({
        duration: 200
      })
      this.data.innerAudioContext = wx.createInnerAudioContext({
        useWebAudioImplement: false
      })
      this.initSDK()
    },
    attached() {
      scoringSession.setFallbackMedia(this)
      this.lastTimeMillis = Date.now()
      if (this.data._autoplay && this.data._audio) {
        this.timerId = setTimeout(() => {
          this.playAudio()
        }, 300)
      }
      this.data.innerAudioContext.onPlay(() => {
        console.log('onPlay')
      })
      this.data.innerAudioContext.onEnded(() => {
        if (this.data.media_state == AUDIO_PLAYING && !wx.getStorageSync('anchor-record')) {
          this.triggerEvent('audioEnd')
        }
        this.stopAni()
        this.setData({
          media_state: IDLE
        })
        this.data.innerAudioContext.stop()
      })
      this.data.innerAudioContext.onError(res => {
        this.stopAni()
        console.log(res)
      })
    },
    detached() {
      this.cancel()
      scoringSession.clearMediaPointers(this)
      this.data.innerAudioContext.offEnded()
      this.data.innerAudioContext.offError()
      this.data.innerAudioContext.offPlay()
      this.data.innerAudioContext.destroy()
    }
  },
  methods: {
    playAudio() {
      if (!this.stopAudio(AUDIO_PLAYING)) {
        if (this.data._audio) {
          this.triggerEvent('beforeplay')
          this.setData({
            media_state: AUDIO_PLAYING
          })
          this.audioPlay(this.data._audio)
          this.startAni()
        } else {
          wx.showToast({
            title: '找不到标准音',
            icon: 'none'
          })
        }
      }
    },
    startRecord() {
      var that = this
      wx.getSetting({
        success(res) {
          if (!res.authSetting['scope.record']) {
            wx.authorize({
              scope: 'scope.record',
              success: res => {
                that.record()
              },
              fail: res => {
                that.triggerEvent('unauthorized', {
                  dialog: {
                    type: 'general',
                    title: '提示',
                    content: '未授权录音功能，无法录音评分，请完成授权。',
                    confirmText: '去授权',
                    cancelText: '取消',
                    confirm: function () {
                      wx.openSetting()
                    }
                  }
                })
              }
            })
          } else {
            that.record()
          }
        }
      })
    },
    record() {
      wx.getNetworkType({
        success: ({ networkType }) => {
          const isConnected = networkType !== 'none'
          wx.setStorageSync('networkType', networkType)
          wx.setStorageSync('isConnected', isConnected)
          if (isConnected) {
            this.doRecordAction()
          } else {
            this.showNetworkDisconnected()
          }
        },
        fail: () => {
          if (wx.getStorageSync('isConnected')) {
            this.doRecordAction()
          } else {
            this.showNetworkDisconnected()
          }
        }
      })
    },
    doRecordAction() {
      if (scoringSession.shouldProtectFromCancel(this)) {
        return
      }
      if (Date.now() - this.lastTimeMillis < 500) {
        return
      }
      this.lastTimeMillis = Date.now()
      if (this.data.media_state !== RECORDING) {
        this.stopAudio()
        feedBackPlayer.src = '/raw/recordstart.mp3'
        feedBackPlayer.play()
        this.doRecord()
        this.lastTimeMillis += 500
      } else if (this.data.media_state == RECORDING) {
        this.stopRecord()
      }
    },
    showNetworkDisconnected() {
      wx.showToast({
        title: '网络连接已断开',
        icon: 'none'
      })
    },
    initSDK() {
      if (!wsEngine) {
        return
      }
      this.refreshSig().catch(() => {})
    },
    refreshSig(force) {
      if (!force && isValidSig(cachedSig)) {
        this.data._sig = cachedSig
        return Promise.resolve(cachedSig)
      }

      if (!sigPromise) {
        sigPromise = new Promise((resolve, reject) => {
          wx.request({
            url: 'https://wechat.kamienglish.com/api/Sig/getInfoWord',
            success: (res) => {
              const sig = Object.assign({}, res.data || {}, {
                userId: 'hello'
              })
              if (!isValidSig(sig)) {
                reject(new Error('invalid sig'))
                return
              }
              cachedSig = sig
              resolve(sig)
            },
            fail: (res) => {
              console.log('request sig fail')
              reject(res)
            },
            complete: () => {
              sigPromise = null
            }
          })
        })
      }

      return sigPromise.then(sig => {
        this.data._sig = sig
        return sig
      })
    },
    ensureSigReady(done, force) {
      if (!force && isValidSig(this.data._sig)) {
        done()
        return
      }

      this.refreshSig(!!force).then(() => {
        done()
      }).catch((res) => {
        console.warn('[media] sig unavailable:', JSON.stringify(res))
        this.preparingRecord = false
        this.resetMarkingState('评分准备失败，请重试')
      })
    },
    handleEngineResult(res) {
      this.clearMarkWatchdog()
      let result = res && res.result
      if (!result || typeof result.overall === 'undefined') {
        console.warn('onResult invalid result', JSON.stringify(res))
        this.resetMarkingState('评分失败，请重试')
        return
      }
      let score = result.overall
      let good = score >= 55
      let translateY = windowWidth / 5
      this.animation.translate(0, -translateY).opacity(1).step()
      this.setData({
        media_state: IDLE,
        score: score,
        animation: this.animation.export()
      })
      this.engineStart = false
      this.devtoolsMock = false
      scoringSession.clearMediaPointers(this)
      feedBackPlayer.src = good ? '/raw/good.aac' : '/raw/wrong.aac'
      feedBackPlayer.play()
      setTimeout(() => {
        this.animation.opacity(0).step()
        this.animation.translate(0, translateY).step({
          duration: 0
        })
        this.setData({
          animation: this.animation.export()
        })
      }, 2000)
      this.triggerEvent('result', {
        index: this.data._index,
        score: score,
        detail: res.result.details,
        tempFilePath: this.data._temp_file_path
      })
    },
    handleEngineErrorResult(res) {
      console.error('[media] wsEngine onErrorResult:', JSON.stringify(res))
      const message = res && res.error ? res.error + ' ' + res.errId : '评分失败，请重试'
      this.resetMarkingState(message)
    },
    audioPlay(src) {
      const ctx = this.data.innerAudioContext
      if (!ctx || !src) {
        return
      }
      ctx.stop()
      ctx.src = src
      ctx.play()
    },
    doRecord() {
      if (!wsEngine) {
        wx.showToast({ title: '语音评测暂不可用', icon: 'none' })
        return
      }
      if (this.preparingRecord) {
        return
      }

      const startRecorder = () => {
        const options = {
          duration: 10000,
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 96000,
          format: 'mp3',
          frameSize: 1
        }
        this.timerId = setTimeout(() => {
          recorderManager.start(options)
        }, 500)
      }

      if (IS_DEVTOOLS) {
        this.preparingRecord = false
        scoringSession.setActiveMedia(this)
        scoringSession.abortOtherScoring(this)
        claimSessionHandlers(this)
        this.devtoolsMock = true
        this.setData({ media_state: RECORDING })
        startRecorder()
        return
      }

      const start = () => {
        this.preparingRecord = false
        scoringSession.setActiveMedia(this)
        scoringSession.abortOtherScoring(this)
        claimSessionHandlers(this)
        this.devtoolsMock = false
        if (!isValidSig(this.data._sig)) {
          this.resetMarkingState('评分准备失败，请重试')
          return
        }
        wsEngine.reset()
        this.engineStart = true
        wsEngine.start({
          request: {
            coreType: this.data._coreType,
            refText: this.data._refText,
            rank: 100,
            attachAudioUrl: 1
          },
          app: this.data._sig,
          audio: {
            audioType: 'mp3',
            channel: 1,
            sampleBytes: 2,
            sampleRate: 16000
          },
          success: (res) => {
            this.setData({
              media_state: RECORDING
            })
            console.log('===start======success===  ' + JSON.stringify(res))
            startRecorder()
          },
          fail: (res) => {
            console.error('[media] wsEngine start fail:', JSON.stringify(res))
            const message = res && res.error ? res.error + ' ' + res.errId : '评分启动失败，请重试'
            this.resetMarkingState(message)
          },
          complete: () => {
            console.log('===start======complete=============')
          }
        })
      }

      if (isValidSig(this.data._sig)) {
        start()
        return
      }

      this.preparingRecord = true
      scoringSession.setActiveMedia(this)
      this.ensureSigReady(start, true)
    },
    stopRecord() {
      console.log('==stopRecord==')
      if (this.recorderStart) {
        recorderManager.stop()
      }
    },
    stopRecording() {
      if (this.data.media_state === RECORDING) {
        this.stopRecord()
      }
    },
    cancelRecord() {
      if (scoringSession.shouldProtectFromCancel(this)) {
        if (this.data.media_state == MARKING || scoringSession.isScoringMedia(this)) {
          this.resetMarkingState()
        }
        return
      }
      this.clearMarkWatchdog()
      if (this.data.media_state == RECORDING) {
        this.setData({
          media_state: IDLE
        })
        this.stopRecord()
      }
      if (this.engineStart && wsEngine) {
        wsEngine.reset()
        this.engineStart = false
      }
      scoringSession.clearMediaPointers(this)
    },
    resetMarkingState(title) {
      this.clearMarkWatchdog()
      if (wsEngine) {
        wsEngine.reset()
      }
      this.engineStart = false
      this.recorderStart = false
      this.preparingRecord = false
      this.devtoolsMock = false
      scoringSession.clearMediaPointers(this)
      this.setData({ media_state: IDLE })
      if (title) {
        wx.showToast({ title, icon: 'none', duration: 3000 })
      }
    },
    startMarkWatchdog() {
      this.clearMarkWatchdog()
      this.markWatchdog = setTimeout(() => {
        this.markWatchdog = null
        if (this.data.media_state == MARKING || scoringSession.isScoringMedia(this)) {
          console.warn('mark watchdog fired, force reset to IDLE')
          this.resetMarkingState('评分超时，请重试')
        }
      }, MARK_TIMEOUT_MS)
    },
    clearMarkWatchdog() {
      if (this.markWatchdog) {
        clearTimeout(this.markWatchdog)
        this.markWatchdog = null
      }
    },
    stopAudio(state) {
      if (this.data.media_state == AUDIO_PLAYING || this.data.media_state == REPLAYING) {
        let result = state == this.data.media_state
        this.stopAni()
        this.setData({
          media_state: IDLE
        })
        this.data.innerAudioContext.stop()
        return result
      }
    },
    startAni() {
      const frames = this.selectComponent('.frames')
      if (frames) {
        frames.setData({
          state: 'running'
        })
      }
    },
    stopAni() {
      const frames = this.selectComponent('.frames')
      if (frames) {
        frames.setData({
          state: 'paused'
        })
      }
    },
    replay() {
      if (this.data.score && !this.stopAudio(REPLAYING)) {
        this.setData({
          media_state: REPLAYING
        })
        this.audioPlay(this.data._temp_file_path)
      }
    },
    cancel() {
      if (this.timerId) {
        clearTimeout(this.timerId)
      }
      this.stopAudio()
      this.cancelRecord()
    },
    restartRecordingWave(attempt) {
      const retry = attempt || 0
      const wave = this.selectComponent('#recording-wave') || this.selectComponent('.recording-wave')
      if (wave && typeof wave.restart === 'function') {
        wave.restart()
        return
      }
      if (retry < 12) {
        setTimeout(() => this.restartRecordingWave(retry + 1), 64)
      }
    }
  }
})
