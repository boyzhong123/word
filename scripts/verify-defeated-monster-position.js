/**
 * CLI 验证：举白旗小怪兽位置 + 导出图顶部留白。
 *
 * 用法：
 *   node scripts/verify-defeated-monster-position.js
 *
 * 依赖：微信开发者工具 CLI + miniprogram-automator（可选，用于真机模拟器测量）
 */
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const homeStylePath = path.join(projectRoot, 'pages/home/home.wxss')
const buildScriptPath = path.join(projectRoot, 'scripts/build-jelly-defeated-v3.py')
const spritePath = path.join(projectRoot, 'images/home/map/monsters/jelly-defeated.png')
const cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

const EXPECTED_TOP_RPX = -34
const MIN_TOP_TRANSPARENT_PX = 24

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function verifyStyles() {
  const homeStyle = readText(homeStylePath)
  const topMatch = homeStyle.match(/\.unit-card-monster-defeated\s*{[^}]*top:\s*(-?\d+)rpx/s)
  if (!topMatch) {
    throw new Error('Missing .unit-card-monster-defeated top rule in home.wxss')
  }
  const topRpx = Number(topMatch[1])
  if (topRpx !== EXPECTED_TOP_RPX) {
    throw new Error(`Expected top: ${EXPECTED_TOP_RPX}rpx, got ${topRpx}rpx`)
  }
  console.log(`[verify-defeated-monster] PASS wxss top: ${topRpx}rpx`)
}

function verifyBuildBias() {
  const buildScript = readText(buildScriptPath)
  if (!/CONTENT_TOP_BIAS\s*=\s*10\s*\*\s*MONSTER_EXPORT_SCALE/.test(buildScript)) {
    throw new Error('Missing CONTENT_TOP_BIAS in build-jelly-defeated-v3.py')
  }
  console.log('[verify-defeated-monster] PASS build script has CONTENT_TOP_BIAS')
}

function verifySpriteHeadroom() {
  if (!fs.existsSync(spritePath)) {
    throw new Error(`Missing sprite: ${spritePath}`)
  }

  const { execFileSync } = require('node:child_process')
  const output = execFileSync('python3', ['-c', `
from PIL import Image
import numpy as np
im = np.array(Image.open(${JSON.stringify(spritePath)}).convert('RGBA'))
a = im[:, :, 3]
first = next(y for y in range(a.shape[0]) if (a[y] > 16).any())
print(first)
`], { encoding: 'utf8' }).trim()
  const firstOpaqueRow = Number(output)
  if (!Number.isFinite(firstOpaqueRow) || firstOpaqueRow < MIN_TOP_TRANSPARENT_PX) {
    throw new Error(
      `Sprite top transparent headroom ${firstOpaqueRow}px < ${MIN_TOP_TRANSPARENT_PX}px`
    )
  }
  console.log(
    `[verify-defeated-monster] PASS sprite top transparent headroom: ${firstOpaqueRow}px`
  )
}

async function verifyInSimulator() {
  let automator
  try {
    automator = require('miniprogram-automator')
  } catch (err) {
    console.warn('[verify-defeated-monster] SKIP simulator check (miniprogram-automator missing)')
    return
  }

  if (!fs.existsSync(cliPath)) {
    console.warn('[verify-defeated-monster] SKIP simulator check (WeChat CLI not found)')
    return
  }

  let miniProgram
  try {
    miniProgram = await automator.launch({
      projectPath: projectRoot,
      cliPath
    })
  } catch (err) {
    console.warn('[verify-defeated-monster] SKIP simulator check:', err.message)
    return
  }

  try {
    await miniProgram.reLaunch('/pages/home/home')
    const page = await miniProgram.currentPage()
    await page.waitFor(1200)

    const layout = await miniProgram.evaluate(() => {
      return new Promise((resolve) => {
        wx.createSelectorQuery()
          .select('.unit-card-completed .unit-card-monster-defeated')
          .boundingClientRect()
          .select('.unit-card-completed .unit-top')
          .boundingClientRect()
          .exec((rects) => {
            const monster = rects[0]
            const unitTop = rects[1]
            if (!monster || !unitTop) {
              resolve({ ok: false, reason: 'defeated monster or unit-top not found' })
              return
            }
            resolve({
              ok: true,
              monsterTop: monster.top,
              unitTopTop: unitTop.top,
              deltaPx: monster.top - unitTop.top
            })
          })
      })
    })

    if (!layout.ok) {
      throw new Error(layout.reason || 'simulator layout query failed')
    }

    const windowInfo = await miniProgram.evaluate(() => {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      return { windowWidth: info.windowWidth || 375 }
    })
    const expectedDeltaPx = (EXPECTED_TOP_RPX / 750) * windowInfo.windowWidth
    const tolerancePx = 4

    if (Math.abs(layout.deltaPx - expectedDeltaPx) > tolerancePx) {
      throw new Error(
        `Simulator monster/card delta ${layout.deltaPx.toFixed(1)}px != expected ${expectedDeltaPx.toFixed(1)}px`
      )
    }

    console.log(
      `[verify-defeated-monster] PASS simulator delta ${layout.deltaPx.toFixed(1)}px (~${EXPECTED_TOP_RPX}rpx)`
    )
  } finally {
    await miniProgram.close()
  }
}

async function main() {
  verifyStyles()
  verifyBuildBias()
  verifySpriteHeadroom()
  await verifyInSimulator()
  console.log('[verify-defeated-monster] ALL CHECKS PASSED')
}

main().catch((err) => {
  console.error('[verify-defeated-monster] FAIL:', err.message)
  process.exit(1)
})
