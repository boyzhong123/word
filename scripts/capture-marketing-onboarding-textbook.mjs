#!/usr/bin/env node
/** 截取新手引导第 2 步（选教材版本）用于宣传物料 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import automator from 'miniprogram-automator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const outDir = path.join(projectRoot, 'docs/images/marketing')
const cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  const dest = path.join(outDir, 'onboarding-step-textbook.png')

  const miniProgram = await automator.launch({
    cliPath,
    projectPath: projectRoot,
    timeout: 120000
  })

  try {
    await miniProgram.navigateTo('/pages/onboarding/onboarding?edit=1')
    await sleep(2500)
    await miniProgram.evaluate(() => {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      if (current && typeof current.setData === 'function') {
        current.setData({
          onboardingStep: 2,
          selectedGradeId: 'g5',
          selectedSemesterId: 's1',
          selectedVersion: 'PEP'
        })
      }
    })
    await sleep(1500)
    await miniProgram.screenshot({ path: dest })
    const kb = fs.statSync(dest).size / 1024
    console.log(`✓ ${dest} (${kb.toFixed(1)} KB)`)
  } finally {
    await miniProgram.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
