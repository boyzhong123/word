const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const projectRoot = path.resolve(__dirname, '..')
const waveScript = fs.readFileSync(path.join(projectRoot, 'components/wave/wave.js'), 'utf8')
const waveTemplate = fs.readFileSync(path.join(projectRoot, 'components/wave/wave.wxml'), 'utf8')
const mediaScript = fs.readFileSync(path.join(projectRoot, 'components/media/media.js'), 'utf8')
const mediaTemplate = fs.readFileSync(path.join(projectRoot, 'components/media/media.wxml'), 'utf8')

function loadWaveComponent() {
  let config = null
  const sandbox = {
    Component(cfg) {
      config = cfg
    },
    require(mod) {
      if (mod.indexOf('recording-wave-debug') >= 0) {
        return { log() {} }
      }
      throw new Error('unexpected require: ' + mod)
    },
    wx: {
      getSystemInfoSync() {
        return { platform: 'devtools', pixelRatio: 2 }
      },
      getWindowInfo() {
        return { pixelRatio: 2 }
      },
      nextTick(cb) {
        cb()
      }
    },
    console,
    setTimeout,
    clearTimeout,
    Date
  }
  vm.runInNewContext(waveScript, sandbox, { filename: 'wave.js' })
  return { config }
}

function createWaveInstance(config, rect) {
  const node = {
    width: 0,
    height: 0,
    requestAnimationFrame(cb) {
      this._raf = cb
      return 1
    },
    cancelAnimationFrame() {
      this._raf = null
    },
    getContext() {
      return {
        scale() {},
        clearRect() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {}
      }
    }
  }
  const instance = {
    data: Object.assign({}, config.data),
    measureRetries: 0,
    setData(patch, cb) {
      Object.assign(this.data, patch)
      if (typeof cb === 'function') {
        cb()
      }
    },
    createSelectorQuery() {
      const self = this
      return {
        in() {
          return this
        },
        select() {
          return this
        },
        fields(_opts) {
          return this
        },
        exec(fn) {
          fn([{ node, width: rect.width, height: rect.height }])
        }
      }
    }
  }
  Object.assign(instance, config.methods)
  return instance
}

function flushTimers(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

test('wave uses canvas 2d sine layers instead of legacy canvas-id or svg', () => {
  assert.match(waveTemplate, /type="2d"/)
  assert.match(waveTemplate, /wx:if="\{\{canvasReady\}\}"/)
  assert.doesNotMatch(waveTemplate, /canvas-id/)
  assert.match(waveScript, /fields\(\{\s*node:\s*true,\s*size:\s*true\s*\}\)/)
  assert.match(waveScript, /pathFuncs/)
  assert.match(waveScript, /getContext\('2d'\)/)
  assert.doesNotMatch(waveScript, /wx\.createCanvasContext/)
  assert.doesNotMatch(waveScript, /recording-wave-smooth/)
})

test('wave remounts canvas node with clear-then-set for real device reuse', () => {
  assert.match(waveScript, /remountCanvas/)
  assert.match(waveScript, /canvasReady:\s*false/)
  assert.match(waveScript, /INIT_DELAY_MS/)
})

test('media increments waveSession and only force-restarts wave as fallback', () => {
  assert.match(mediaTemplate, /wx:key="ws-\{\{waveSession\}\}"/)
  assert.match(mediaScript, /waveSession:\s*0/)
  assert.match(mediaScript, /wave\.running/)
  assert.match(mediaScript, /retry >= 8/)
})

test('media clears pending wave retry timers when recording stops', () => {
  assert.match(mediaScript, /clearRecordingWaveRetry/)
  assert.match(mediaScript, /clearTimeout\(this\.waveRetryTimer\)/)
  assert.match(mediaScript, /this\.waveRetryToken/)
  assert.match(mediaScript, /this\.data\.media_state !== RECORDING/)
})

test('simulated wave lifecycle starts drawing on first and third recording', async () => {
  const { config } = loadWaveComponent()
  const rect = { width: 320, height: 53 }

  for (let session = 1; session <= 3; session += 1) {
    const wave = createWaveInstance(config, rect)
    config.lifetimes.ready.call(wave)
    await flushTimers(200)

    assert.equal(wave.running, true, 'session ' + session + ' should enter draw loop')
    assert.ok(wave.ctx, 'session ' + session + ' should create 2d context')

    config.lifetimes.detached.call(wave)
    assert.equal(wave.running, false)
  }
})

test('simulated restart remounts canvas after stop', async () => {
  const { config } = loadWaveComponent()
  const wave = createWaveInstance(config, { width: 300, height: 53 })
  config.lifetimes.ready.call(wave)
  await flushTimers(200)
  assert.equal(wave.running, true)

  wave.restart()
  await flushTimers(250)
  assert.equal(wave.running, true)
  wave.stop()
})

test('wave stop cancels pending animation frame before releasing canvas', async () => {
  const { config } = loadWaveComponent()
  const wave = createWaveInstance(config, { width: 300, height: 53 })
  config.lifetimes.ready.call(wave)
  await flushTimers(200)

  const canvas = wave.canvas
  assert.equal(typeof canvas._raf, 'function')
  wave.stop()
  assert.equal(wave.running, false)
  assert.equal(canvas._raf, null)
  assert.equal(wave.canvas, null)
})
