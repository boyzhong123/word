/**
 * 验证录音波浪线的渲染位置：wave 画布应与 "点击波纹，结束录音" 提示
 * 一起在浮层内居中（wave 紧贴提示上方），而不是脱离布局跑到浮层顶部。
 * 用法：先在微信开发者工具打开本项目并编译，再执行
 *   node scripts/verify-wave-position.js
 */
const automator = require('miniprogram-automator')
const path = require('node:path')

const projectPath = path.resolve(__dirname, '..')
const cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

async function main() {
  const miniProgram = await automator.launch({ projectPath, cliPath })
  try {
    await miniProgram.reLaunch('/pages/listen/listen')
    const page = await miniProgram.currentPage()
    await page.waitFor(1500)

    const result = await miniProgram.evaluate(() => {
      return new Promise((resolve) => {
        const listenPage = getCurrentPages()[getCurrentPages().length - 1]
        listenPage.setData({
          loading: false,
          quizMode: false,
          currentPage: 1,
          tracks: [{
            type: 'sentence',
            content: 'Practice makes perfect.',
            refText: 'Practice makes perfect.',
            translation: '熟能生巧。',
            audio: 'https://example.com/practice.mp3'
          }]
        }, () => {
          setTimeout(() => {
            listenPage.setData({ expandedIndex: 0 }, () => {
              setTimeout(() => {
                const media = listenPage.selectComponent('.follow-media')
                if (!media) { resolve({ ok: false, reason: 'no follow-media' }); return }
                media.setData({ media_state: 2 })
                // 强制一个稳定可测的浮层尺寸
                listenPage.setData({
                  followRecordingOverlay: {
                    active: true, top: 200, left: 24, width: 320, height: 240, waveSession: 1
                  }
                }, () => {
                  setTimeout(() => {
                    const q = listenPage.createSelectorQuery()
                    q.select('.follow-recording-overlay').boundingClientRect()
                    q.select('.follow-recording-wave').boundingClientRect()
                    q.select('.follow-recording-tip').boundingClientRect()
                    q.exec((rects) => {
                      resolve({ ok: true, overlay: rects[0], wave: rects[1], tip: rects[2] })
                    })
                  }, 1200)
                })
              }, 500)
            })
          }, 400)
        })
      })
    })

    if (!result.ok) {
      console.error('[verify-wave-position] FAIL 准备阶段:', result.reason)
      process.exitCode = 1
      return
    }

    const { overlay, wave, tip } = result
    console.log('[verify-wave-position] rects:', JSON.stringify(result, null, 2))

    if (!overlay || !wave || !tip) {
      console.error('[verify-wave-position] FAIL: 缺少 rect（wave/tip/overlay 未渲染）')
      process.exitCode = 1
      return
    }

    const overlayCenter = overlay.top + overlay.height / 2
    const waveCenter = wave.top + wave.height / 2
    const gapWaveToTip = tip.top - wave.bottom            // wave 与提示间距
    const waveCenterOffsetFromOverlayCenter = Math.abs(waveCenter - overlayCenter)

    // wave 应在提示正上方，间距很小（< 30px）；居中组应靠近浮层垂直中心。
    const adjacent = gapWaveToTip >= -2 && gapWaveToTip < 30
    const centered = waveCenterOffsetFromOverlayCenter < overlay.height * 0.35
    const notAtTop = wave.top - overlay.top > 10

    console.log('[verify-wave-position] gapWaveToTip=%spx, waveCenterOffset=%spx, notAtTop=%s',
      gapWaveToTip.toFixed(1), waveCenterOffsetFromOverlayCenter.toFixed(1), notAtTop)

    if (adjacent && centered && notAtTop) {
      console.log('[verify-wave-position] PASS: 波浪线与提示一起居中、紧贴提示上方')
    } else {
      console.error('[verify-wave-position] FAIL: 波浪线位置不对', { adjacent, centered, notAtTop })
      process.exitCode = 1
    }
  } finally {
    await miniProgram.close()
  }
}

main().catch(err => { console.error('[verify-wave-position] 异常:', err); process.exit(1) })
