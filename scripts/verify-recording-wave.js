/**
 * 真机/开发者工具自动化：验证录音浮层里 wave 组件能初始化。
 * 用法：先打开微信开发者工具并编译本项目，再执行
 *   node scripts/verify-recording-wave.js
 */
const automator = require('miniprogram-automator')
const path = require('node:path')

const projectPath = path.resolve(__dirname, '..')
const cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
const STEP_TIMEOUT_MS = 10000

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ok: false, reason: label + ' timeout' })
      }, STEP_TIMEOUT_MS)
    })
  ])
}

async function main() {
  let miniProgram
  try {
    miniProgram = await automator.launch({
      projectPath,
      cliPath
    })
  } catch (err) {
    console.error('[verify-recording-wave] 无法启动开发者工具:', err.message)
    console.error('请先在微信开发者工具中打开本项目并完成一次编译，然后重试。')
    process.exit(1)
  }

  try {
    console.log('[verify-recording-wave] 打开随身听页')
    const openResult = await withTimeout(
      miniProgram.reLaunch('/pages/listen/listen').then(() => ({ ok: true })),
      '打开随身听页'
    )
    if (!openResult.ok) {
      console.error('[verify-recording-wave] FAIL:', openResult.reason)
      process.exitCode = 1
      return
    }
    const page = await miniProgram.currentPage()
    await page.waitFor(1500)

    async function runWaveSession(label) {
      const state = await withTimeout(miniProgram.evaluate((sessionLabel) => {
        return new Promise((resolve) => {
          const pages = getCurrentPages()
          const listenPage = pages[pages.length - 1]
          if (!listenPage) {
            resolve({ ok: false, reason: 'no page' })
            return
          }

          listenPage.setData({
            loading: false,
            quizMode: true,
            quizPhase: 'recite',
            quizIndex: 0,
            quizQuestion: {
              audio: '',
              sentence: 'Practice makes perfect.',
              translation: '熟能生巧。'
            },
            quizReciteParts: [
              { type: 'text', text: 'Practice makes perfect.' }
            ],
            quizReciteScore: '',
            quizMarking: false,
            quizAllDone: false
          })

          setTimeout(() => {
            const media = listenPage.selectComponent('.quiz-recite-media')
            if (!media) {
              resolve({ ok: false, reason: 'no media on page', label: sessionLabel })
              return
            }

            media.setData({ media_state: 2 })
            setTimeout(() => {
              const wave = media.selectComponent('#recording-wave') || media.selectComponent('.recording-wave')
              if (!wave) {
                resolve({
                  ok: false,
                  reason: 'wave not mounted',
                  label: sessionLabel,
                  mediaState: media.data.media_state
                })
                return
              }
              resolve({
                ok: !!wave.data.active,
                label: sessionLabel,
                active: !!wave.data.active,
                mediaState: media.data.media_state
              })
            }, 700)
          }, 200)
        })
      }, label), label)

      console.log('[verify-recording-wave] ' + label + ' wave 状态:', JSON.stringify(state, null, 2))
      return state
    }

    async function stopWaveSession() {
      await miniProgram.evaluate(() => {
        const pages = getCurrentPages()
        const listenPage = pages[pages.length - 1]
        const media = listenPage && listenPage.selectComponent('.quiz-recite-media')
        if (media) {
          media.setData({ media_state: 0 })
        }
      })
      await page.waitFor(300)
    }

    const waveReady = await runWaveSession('第一次录音')

    if (!waveReady.ok) {
      console.error('[verify-recording-wave] FAIL: 第一次录音波浪线未初始化')
      process.exitCode = 1
      return
    }

    await stopWaveSession()
    const secondReady = await runWaveSession('第二次录音')

    if (!secondReady.ok) {
      console.error('[verify-recording-wave] FAIL: 第二次录音波浪线未初始化')
      process.exitCode = 1
      return
    }

    await stopWaveSession()
    const thirdReady = await runWaveSession('第三次录音')

    if (!thirdReady.ok) {
      console.error('[verify-recording-wave] FAIL: 第三次录音波浪线未初始化')
      process.exitCode = 1
      return
    }

    console.log('[verify-recording-wave] PASS: 连续三次录音 wave 均成功激活')
  } finally {
    const closeResult = await withTimeout(
      miniProgram.close().then(() => ({ ok: true })),
      '关闭开发者工具连接'
    )
    if (!closeResult.ok) {
      console.warn('[verify-recording-wave] WARN:', closeResult.reason)
      if (process.exitCode) {
        process.exit(process.exitCode)
      }
    }
  }
}

main().catch(err => {
  console.error('[verify-recording-wave] 异常:', err)
  process.exit(1)
})
