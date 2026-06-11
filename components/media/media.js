// components/meida/media.js
const aiengine = require('../../lib/ChivoxAiEngine.js')

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
var windowWidth = wx.getStorageSync('windowWidth')
Component({
  options: {
    pureDataPattern: /^_/
  },
  /**
   * 组件的属性列表
   */
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
      value: ""
    },
    _audioState: {
      type: String,
      value: "running"
    },
    _refText: {
      type: String,
      value: ""
    },
    _coreType: {
      type: String,
      value: ""
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
  /**
   * 组件的初始数据
   */
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
      this.cancel()
    }
  },
  lifetimes: {
    created() {
      this.animation = wx.createAnimation({
        duration: 200
      })
      this.data.innerAudioContext = wx.createInnerAudioContext({
        useWebAudioImplement: false
      })
      this.initSDK()
    },
    attached() {
      this.lastTimeMillis = Date.now()
      if (this.data._autoplay && this.data._audio) {
        this.timerId = setTimeout(() => {
          this.playAudio()
        }, 300)
      }
      this.data.innerAudioContext.onPlay(() => {
        console.log("onPlay")
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
      this.data.innerAudioContext.offEnded()
      this.data.innerAudioContext.offError()
      this.data.innerAudioContext.offPlay()
      this.data.innerAudioContext.destroy()
    }
  },
  /**
   * 组件的方法列表
   */
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
                    confirmText: "去授权",
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
      if (this.data.media_state == MARKING) {
        // TODO 评分中不响应播放事件
      } else {
        if (Date.now() - this.lastTimeMillis < 500) {
          return
        }
        this.lastTimeMillis = Date.now()
        if (this.data.media_state !== RECORDING) {
          this.stopAudio()
          feedBackPlayer.src = "/raw/recordstart.mp3"
          feedBackPlayer.play()
          this.doRecord()
          this.lastTimeMillis += 500
        } else if (this.data.media_state == RECORDING) {
          this.stopRecord()
        } else { }
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
      let that = this
      wsEngine.onResult(res => {
        that.clearMarkWatchdog()
        let result = res && res.result
        if (!result || typeof result.overall === 'undefined') {
          // 结果异常时也要恢复界面，避免一直停留在“评分中...”
          console.warn('onResult invalid result', JSON.stringify(res))
          that.setData({ media_state: IDLE })
          wx.showToast({ title: '评分失败，请重试', icon: 'none' })
          return
        }
        let score = result.overall
        let good = score >= 55
        let translateY = windowWidth / 5
        that.animation.translate(0, -translateY).opacity(1).step()
        that.setData({
          media_state: IDLE,
          score: score,
          animation: that.animation.export()
        })
        feedBackPlayer.src = good ? "/raw/good.aac" : "/raw/wrong.aac"
        feedBackPlayer.play()
        setTimeout(() => {
          that.animation.opacity(0).step()
          that.animation.translate(0, translateY).step({
            duration: 0  //回到原位置
          })
          that.setData({
            animation: that.animation.export()
          })
        }, 2000)
        that.triggerEvent('result', {
          index: that.data._index,
          score: score,
          detail: res.result.details,
          tempFilePath: that.data._temp_file_path
        })
      })
      wsEngine.onErrorResult(res => {
        console.error('[media] wsEngine onErrorResult:', JSON.stringify(res))
        that.clearMarkWatchdog()
        wx.showToast({
          title: res.error + " " + res.errId,
          icon: 'none',
          duration: 3000
        })
        that.setData({
          media_state: IDLE
        })
      })
      wx.request({
        url: 'https://wechat.kamienglish.com/api/Sig/getInfoWord',//驰声签名地址，微信要求必须是https环境的地址
        success: (res) => {
          that.data._sig = res.data
          that.data._sig.userId = "hello"
        },
        fail: (res) => {
          console.log("request sig fail");
        }
      })
      //监听录音开始事件
      recorderManager.onStart(() => {
        that.recorderStart = true
        console.log('recorderManager onStart')
      })
      //监听录音结束事件
      recorderManager.onStop((res) => {
        that.recorderStart = false
        console.log('recorderManager onStop')
        if (that.data.media_state == RECORDING) {
          that.data._temp_file_path = res.tempFilePath
          //录音机结束后，驰声引擎执行结束操作，等待评测返回结果
          wsEngine.stop({
            success: () => {
              that.setData({
                media_state: MARKING
              })
              that.startMarkWatchdog()
              console.log('====== wsEngine stop success ======')
            },
            fail: (res) => {
              console.log("====== wsEngine stop fail ======")
              console.log(res); //请关注res.errId, res.error
            },
            complete: () => {
              console.log("====== wsEngine stop complete ======")
            }
          })
        }
      })
      recorderManager.onInterruptionBegin((res) => {
        console.log('onInterruptionBegin', JSON.stringify(res))
      })
      recorderManager.onInterruptionEnd((res) => {
        console.log('onInterruptionEnd', JSON.stringify(res))
      })
      //监听已录制完指定帧大小的文件事件。如果设置了 frameSize，则会回调此事件。
      recorderManager.onFrameRecorded((res) => {
        const { frameBuffer } = res
        if (frameBuffer && that.data.media_state == RECORDING) {
          console.log('frameBuffer.byteLength', frameBuffer.byteLength)
          //TODO 调用feed接口传递音频片给驰声评测引擎
          wsEngine.feed({
            data: frameBuffer,    // frameBuffer为微信录音机回调的音频数据
            success: () => {
              // feed 成功
              console.log('feed success.')
            },
            fail: (res) => {
              // feed 失败, 请关注res.errId, res.error
              console.log('feed fail:', JSON.stringify(res))
            },
            complete: () => {
              // feed 完成
            }
          })
        }
      })
      //监听录音错误事件
      recorderManager.onError((res) => {
         this.cancelRecord()
         console.log('recorder fail', res)
      })
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
    /**
  * 开始录音
  */
    doRecord() {
      if (!wsEngine) {
        wx.showToast({ title: '语音评测暂不可用', icon: 'none' })
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
          audioType: "mp3",
          channel: 1,
          sampleBytes: 2,
          sampleRate: 16000
        },
        success: (res) => {
          this.setData({
            media_state: RECORDING
          })
          // start成功，请关注res.tokenId（本次评测的唯一标识）
          console.log("===start======success===  " + JSON.stringify(res));
          /*引擎启动成功，可以启动录音机开始录音，并将音频片传给引擎*/
          const options = {
            duration: 10000,//指定录音的时长，单位 ms
            sampleRate: 16000,//采样率
            numberOfChannels: 1,//录音通道数
            encodeBitRate: 96000,//编码码率
            format: 'mp3',//音频格式，有效值aac/mp3
            frameSize: 1 //指定帧大小，单位 KB
          };
          //开始录音,在开始录音回调中feed音频片
          this.timerId = setTimeout(() => {
            recorderManager.start(options) //延时不要把‘叮’录进去
          }, 500)
        },
        fail: (res) => {
          console.error('[media] wsEngine start fail:', JSON.stringify(res))
          wx.showToast({
            title: res.error + " " + res.errId,
            icon: 'none',
            duration: 3000
          })
        },
        complete: () => {
          console.log("===start======complete=============");
        }
      });
    },
    stopRecord() {
      console.log('==stopRecord==')
      /******先把微信录音机停掉,再停掉驰声引擎******/
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
    },
    // 评分兜底：极端情况下引擎既不回结果也不回错误时，避免界面一直卡在“评分中...”
    startMarkWatchdog() {
      this.clearMarkWatchdog()
      this.markWatchdog = setTimeout(() => {
        this.markWatchdog = null
        if (this.data.media_state == MARKING) {
          console.warn('mark watchdog fired, force reset to IDLE')
          if (wsEngine) {
            wsEngine.reset()
          }
          this.setData({ media_state: IDLE })
          wx.showToast({ title: '评分超时，请重试', icon: 'none' })
        }
      }, 65000)
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
