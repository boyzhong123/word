// 随身听全局播放器（单例）
//
// 把音频上下文与“通常听力播放”的状态/逻辑收敛到这里，使得：
//   1. 离开 listen 页时不销毁音频，跨页持续播放；
//   2. 底部 tab 栏的迷你播放器可订阅同一份状态。
// 听力小测（quiz）不走此单例，仍由 listen 页用局部音频处理。

const { getUnits, getUnitResource } = require('./api')

// 循环模式：列表循环 / 单曲循环 / 随机播放
const LOOP_MODES = [
  { key: 'list', label: '列' },
  { key: 'single', label: '单' },
  { key: 'shuffle', label: '随' }
]
// 倍速档位
const SPEEDS = [1, 1.25, 1.5, 2, 0.75]

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds) || seconds < 0) {
    return '00:00'
  }
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
}

function speedLabel(speed) {
  return speed.toFixed(speed % 1 === 0 ? 1 : 2) + 'x'
}

// 把一期资源拍平成顺序播放列表：单词 -> 该词的例句 -> 下一个单词 ...
function buildTracks(source) {
  const list = Array.isArray(source) ? source : []
  const tracks = []
  list.forEach(item => {
    if (!item) {
      return
    }
    if (item.word && item.word.audio) {
      tracks.push({
        type: 'word',
        content: item.word.content || '',
        symbol: item.word.symbol ? '[' + item.word.symbol + ']' : '',
        translation: (item.word.attribute || '') + (item.word.translation || ''),
        audio: item.word.audio
      })
    }
    if (Array.isArray(item.proverb)) {
      item.proverb.forEach(p => {
        if (p && p.audio) {
          tracks.push({
            type: 'sentence',
            content: p.content || p.label || '',
            symbol: '',
            translation: p.translation || '',
            audio: p.audio
          })
        }
      })
    }
  })
  return tracks
}

const player = {
  // ----- 状态 -----
  active: false,
  resBookId: '',
  units: [],
  unitIndex: 0,
  unitName: '随身听',
  bookCover: '../../images/home/book-cover.png',
  tracks: [],
  current: 0,
  playing: false,
  progress: 0,
  currentTime: '00:00',
  speedIndex: 0,
  loopIndex: 0,

  // ----- 内部 -----
  audio: null,
  listeners: [],
  seeking: false,
  pendingSeekFrac: null,

  /* --------------------------- 订阅 / 快照 --------------------------- */

  getSnapshot() {
    const track = this.tracks[this.current] || null
    return {
      active: this.active,
      resBookId: this.resBookId,
      units: this.units,
      unitIndex: this.unitIndex,
      unitName: this.unitName,
      bookCover: this.bookCover,
      tracks: this.tracks,
      current: this.current,
      currentTrack: track,
      playing: this.playing,
      progress: this.progress,
      currentTime: this.currentTime,
      speedIndex: this.speedIndex,
      speedLabel: speedLabel(SPEEDS[this.speedIndex]),
      loopIndex: this.loopIndex,
      loopLabel: LOOP_MODES[this.loopIndex].label
    }
  },

  subscribe(fn) {
    if (typeof fn !== 'function' || this.listeners.indexOf(fn) >= 0) {
      return
    }
    this.listeners.push(fn)
    // 订阅即推送一次当前状态
    fn(this.getSnapshot())
  },

  unsubscribe(fn) {
    const i = this.listeners.indexOf(fn)
    if (i >= 0) {
      this.listeners.splice(i, 1)
    }
  },

  emit() {
    const snapshot = this.getSnapshot()
    this.listeners.forEach(fn => {
      try {
        fn(snapshot)
      } catch (e) {
        console.log('[player] listener error', e)
      }
    })
  },

  /* ------------------------------ 音频 ------------------------------ */

  ensureAudio() {
    if (this.audio) {
      return this.audio
    }
    const audio = wx.createInnerAudioContext({ useWebAudioImplement: false })
    this.audio = audio

    audio.onTimeUpdate(() => {
      if (this.seeking) {
        return
      }
      const duration = audio.duration || 0
      const currentTime = audio.currentTime || 0
      const count = this.tracks.length || 1
      const frac = duration ? Math.min(currentTime / duration, 1) : 0
      // 整期进度：已播完的条目 + 当前条目内进度，占全部条目的比例
      const overall = ((this.current + frac) / count) * 100
      this.progress = Math.min(overall, 100)
      this.currentTime = formatTime(currentTime)
      this.emit()
    })

    audio.onCanplay(() => {
      // 拖动进度条跨条目时，待音频就绪后定位到目标位置
      if (this.pendingSeekFrac != null) {
        const frac = this.pendingSeekFrac
        this.pendingSeekFrac = null
        const d = audio.duration || 0
        if (d) {
          audio.seek(frac * d)
        }
      }
    })

    audio.onEnded(() => this.handleEnded())

    audio.onError(res => {
      console.log('[player] audio error', res)
      this.playing = false
      this.emit()
    })

    return audio
  },

  /* --------------------------- 启动 / 加载 --------------------------- */

  isActiveFor(resBookId) {
    return this.active && !!resBookId && String(this.resBookId) === String(resBookId)
  },

  // 进入随身听：若已是同一本书的活跃会话则不重载（resume），否则拉取期列表并播放。
  // 返回 Promise，便于调用方在加载完成后处理。
  start({ resBookId, bookCover, targetUnitId } = {}) {
    if (bookCover) {
      this.bookCover = bookCover
    }
    if (this.isActiveFor(resBookId)) {
      this.emit()
      return Promise.resolve(true)
    }
    this.resBookId = resBookId || ''
    if (!this.resBookId) {
      wx.showToast({ title: '请先在学习页选择教材', icon: 'none' })
      return Promise.resolve(false)
    }
    this.ensureAudio()
    return getUnits(this.resBookId).then(data => {
      const list = (data && Array.isArray(data.list)) ? data.list : []
      if (!list.length) {
        wx.showToast({ title: '暂无可听内容', icon: 'none' })
        return false
      }
      const targetIndex = targetUnitId
        ? list.findIndex(item => String(item.unitId) === String(targetUnitId))
        : 0
      this.units = list
      return this.loadUnit(Math.max(targetIndex, 0), true)
    })
  },

  // 加载某一期资源并构建播放列表。autoPlay：是否自动播放；toEnd：定位到末条。
  loadUnit(index, autoPlay, toEnd) {
    const unit = this.units[index]
    if (!unit) {
      return Promise.resolve(false)
    }
    if (unit.needVip) {
      wx.showToast({ title: '该期为会员内容', icon: 'none' })
      return Promise.resolve(false)
    }
    return getUnitResource(unit.unitId).then(list => {
      const source = Array.isArray(list) ? list : []
      const tracks = buildTracks(source)
      const unitName = (source[0] && source[0].unit && source[0].unit.unitName) ||
        unit.unitName || ('第' + (unit.sort || index + 1) + '期')

      this.unitIndex = index
      this.unitName = unitName
      this.tracks = tracks
      this.current = toEnd ? Math.max(tracks.length - 1, 0) : 0
      this.progress = 0
      this.currentTime = '00:00'

      if (!tracks.length) {
        this.active = true
        this.playing = false
        this.emit()
        wx.showToast({ title: '本期暂无音频', icon: 'none' })
        return false
      }
      this.active = true
      this.loadCurrent(autoPlay)
      return true
    })
  },

  loadCurrent(autoPlay) {
    const track = this.tracks[this.current]
    const audio = this.ensureAudio()
    if (!track) {
      return
    }
    audio.stop()
    audio.src = track.audio
    if (audio.playbackRate !== undefined) {
      try { audio.playbackRate = SPEEDS[this.speedIndex] } catch (e) {}
    }
    const count = this.tracks.length || 1
    this.progress = (this.current / count) * 100
    this.currentTime = '00:00'
    if (autoPlay) {
      audio.play()
      this.playing = true
    } else {
      this.playing = false
    }
    this.emit()
  },

  handleEnded() {
    const mode = LOOP_MODES[this.loopIndex].key
    if (mode === 'single') {
      this.loadCurrent(true)
      return
    }
    if (mode === 'shuffle') {
      const len = this.tracks.length
      let next = this.current
      if (len > 1) {
        while (next === this.current) {
          next = Math.floor(Math.random() * len)
        }
      }
      this.current = next
      this.loadCurrent(true)
      return
    }
    // 列表循环
    this.next(true)
  },

  /* ------------------------------ 控制 ------------------------------ */

  toggle() {
    if (!this.tracks.length) {
      return
    }
    if (this.playing) {
      this.pause()
    } else {
      this.play()
    }
  },

  play() {
    if (!this.tracks.length) {
      return
    }
    this.ensureAudio().play()
    this.playing = true
    this.emit()
  },

  pause() {
    if (this.audio) {
      this.audio.pause()
    }
    this.playing = false
    this.emit()
  },

  // 关闭随身听：停止播放并下线（迷你播放条随 active=false 消失）
  stop() {
    if (this.audio) {
      this.audio.stop()
    }
    this.playing = false
    this.active = false
    this.emit()
  },

  prev() {
    if (!this.tracks.length) {
      return
    }
    if (this.current > 0) {
      this.current -= 1
      this.loadCurrent(true)
    } else if (this.unitIndex > 0) {
      // 切到上一期最后一条
      this.loadUnit(this.unitIndex - 1, true, true)
    } else {
      this.loadCurrent(true)
    }
  },

  next(autoPlay) {
    if (!this.tracks.length) {
      return
    }
    if (this.current < this.tracks.length - 1) {
      this.current += 1
      this.loadCurrent(true)
    } else if (this.unitIndex < this.units.length - 1) {
      // 进入下一期
      this.loadUnit(this.unitIndex + 1, true)
    } else {
      // 最后一期最后一条：回到第一条
      this.current = 0
      this.loadCurrent(autoPlay)
    }
  },

  // 点击播放列表某条
  selectTrack(index) {
    if (index === this.current) {
      this.toggle()
      return
    }
    this.current = index
    this.loadCurrent(true)
  },

  // 聚焦到某一条：同步进度条与示范音源到该条，但不自动播放
  // （点击课文展开测评时用：先暂停随身听，由 media 组件播标准音）
  focusTrack(index) {
    if (index < 0 || index >= this.tracks.length) {
      return
    }
    this.current = index
    this.loadCurrent(false)
  },

  // 切换到某一期
  selectUnit(index) {
    if (index === this.unitIndex) {
      return
    }
    this.loadUnit(index, true)
  },

  /* ----------------------------- 进度条 ----------------------------- */

  setSeeking(flag) {
    this.seeking = !!flag
  },

  // 拖动预览：仅更新进度条外观
  previewSeek(value) {
    this.progress = value
    this.emit()
  },

  // 松手后定位：进度条覆盖整期，落点换算成第几条 + 条内位置
  seekToValue(value) {
    const count = this.tracks.length
    if (!count) {
      return
    }
    const globalPos = (value / 100) * count
    let idx = Math.floor(globalPos)
    if (idx >= count) {
      idx = count - 1
    }
    if (idx < 0) {
      idx = 0
    }
    const frac = Math.min(Math.max(globalPos - idx, 0), 0.999)
    const audio = this.ensureAudio()

    if (idx === this.current) {
      const duration = audio.duration || 0
      if (duration) {
        audio.seek(frac * duration)
      }
      this.progress = value
      this.emit()
    } else {
      this.pendingSeekFrac = frac
      this.current = idx
      this.progress = value
      this.loadCurrent(true)
    }
  },

  /* --------------------------- 倍速 / 循环 --------------------------- */

  toggleSpeed() {
    this.speedIndex = (this.speedIndex + 1) % SPEEDS.length
    const speed = SPEEDS[this.speedIndex]
    if (this.audio && this.audio.playbackRate !== undefined) {
      try { this.audio.playbackRate = speed } catch (e) {}
    }
    this.emit()
  },

  toggleLoop() {
    this.loopIndex = (this.loopIndex + 1) % LOOP_MODES.length
    this.emit()
    wx.showToast({
      title: ['列表循环', '单曲循环', '随机播放'][this.loopIndex],
      icon: 'none',
      duration: 800
    })
  }
}

module.exports = {
  player,
  buildTracks,
  formatTime,
  LOOP_MODES,
  SPEEDS
}
