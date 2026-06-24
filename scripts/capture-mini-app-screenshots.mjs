#!/usr/bin/env node
/**
 * 通过微信开发者工具 CLI + miniprogram-automator 截取各页面截图。
 * 前置：开发者工具 → 设置 → 安全 → 开启「服务端口 / CLI 调用」
 *
 * 用法：
 *   node scripts/capture-mini-app-screenshots.mjs          # 全部
 *   node scripts/capture-mini-app-screenshots.mjs --only practice,quiz
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import automator from 'miniprogram-automator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const outDir = path.join(projectRoot, 'docs/images/mini-app')
const cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

const onlyArg = process.argv.find((a) => a.startsWith('--only='))
const onlyKeys = onlyArg
  ? onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean)
  : null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function encodeName(name) {
  return encodeURIComponent(name || '')
}

function buildQuery(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
}

async function waitHomeReady(page, timeoutMs = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const data = await page.data()
    if (data && data.loading === false && data.book && (data.listUnits?.length || data.units?.length)) {
      return data
    }
    await sleep(500)
  }
  return page.data()
}

async function bootstrapContext(miniProgram) {
  await miniProgram.switchTab('/pages/home/home')
  await sleep(3500)
  const page = await miniProgram.currentPage()
  const data = await waitHomeReady(page)
  const book = data.book || {}
  const units = Array.isArray(data.listUnits) && data.listUnits.length
    ? data.listUnits
    : (Array.isArray(data.units) ? data.units : [])
  const unit = units.find((u) => u && (u.unitId || u.id)) || units[0] || {}
  const ctx = {
    resBookId: book.resBookId || '',
    unitId: unit.unitId || unit.id || '',
    bookName: book.name || '',
    unitSort: unit.sort || 1
  }
  console.log('Context:', ctx)
  return ctx
}

function makeShots(ctx) {
  const { resBookId, unitId, bookName, unitSort } = ctx
  const practiceQuery = buildQuery({
    resBookId,
    unitId,
    name: bookName,
    taskType: 'word'
  })
  const reciteQuery = buildQuery({
    resBookId,
    unitId,
    name: bookName,
    taskType: 'recitation'
  })
  const listenQuery = buildQuery({ resBookId, unitId, name: bookName })
  const quizQuery = buildQuery({ resBookId, unitId, name: bookName, mode: 'quiz' })
  const finishQuery = buildQuery({
    resBookId,
    unitId,
    name: bookName,
    taskType: 'word',
    unitSort,
    scoreRate: 85
  })
  const finishReciteQuery = buildQuery({
    resBookId,
    unitId,
    name: bookName,
    taskType: 'recitation',
    unitSort,
    scoreRate: 85
  })
  const finishListenQuery = buildQuery({
    resBookId,
    unitId,
    name: bookName,
    taskType: 'listening',
    unitSort,
    scoreRate: 85
  })

  return [
    {
      key: 'home-list',
      file: '01-home-level-list.png',
      label: '首页闯关列表',
      navigate: (mp) => mp.switchTab('/pages/home/home'),
      waitMs: 5000
    },
    {
      key: 'home-map',
      file: '01-home-map.png',
      label: '首页地图视图',
      navigate: (mp) => mp.switchTab('/pages/home/home'),
      waitMs: 4000,
      prepare: async (page) => {
        await page.waitFor(1200)
        const mapBtn = await page.$('.level-view-tab[data-mode="map"]')
        if (mapBtn) {
          await mapBtn.tap()
          await page.waitFor(1500)
        }
      }
    },
    {
      key: 'home-book-picker',
      file: '01-home-book-picker.png',
      label: '选择教材',
      navigate: (mp) => mp.switchTab('/pages/home/home'),
      waitMs: 4500,
      prepare: async (page) => {
        await page.waitFor(1500)
        const switchBtn = await page.$('.book-cover-column')
        if (switchBtn) {
          await switchBtn.tap()
          await page.waitFor(2000)
        }
      }
    },
    {
      key: 'checkin',
      file: '02-checkin-calendar.png',
      label: '打卡日历',
      navigate: (mp) => mp.navigateTo('/pages/checkin/calendar'),
      waitMs: 4500
    },
    {
      key: 'listen',
      file: '03-listen-player.png',
      label: '随身听播放',
      navigate: (mp) => mp.navigateTo(`/pages/listen/listen?${listenQuery}`),
      waitMs: 7000
    },
    {
      key: 'quiz',
      file: '03-listen-quiz.png',
      label: '关卡小测',
      navigate: (mp) => mp.navigateTo(`/pages/listen/listen?${quizQuery}`),
      waitMs: 7000
    },
    {
      key: 'me',
      file: '04-me-profile.png',
      label: '我的',
      navigate: (mp) => mp.switchTab('/pages/me/me'),
      waitMs: 4500
    },
    {
      key: 'book',
      file: '04-me-book.png',
      label: '我的教材',
      navigate: (mp) => mp.navigateTo('/pages/me/book'),
      waitMs: 4500
    },
    {
      key: 'practice',
      file: '05-practice-word.png',
      label: '单词新学',
      navigate: (mp) => mp.navigateTo(`/pages/practice/practice?${practiceQuery}`),
      waitMs: 8000,
      prepare: async (page) => {
        await page.waitFor(2000)
        const loading = await page.data('loading')
        if (loading) {
          await page.waitFor(4000)
        }
      },
      minKb: 40
    },
    {
      key: 'recite',
      file: '05-practice-recite.png',
      label: '跟读背诵',
      navigate: (mp) => mp.navigateTo(`/pages/practice/practice?${reciteQuery}`),
      waitMs: 8000,
      minKb: 40
    },
    {
      key: 'finish',
      file: '06-finish-word.png',
      label: '完成单词新学',
      navigate: async (mp) => {
        await mp.switchTab('/pages/home/home')
        await sleep(2000)
        return mp.navigateTo(`/pages/finish/today?${finishQuery}`)
      },
      waitMs: 4000
    },
    {
      key: 'finish-today',
      file: '06-finish-today.png',
      label: '环节完成（打卡）',
      navigate: async (mp) => {
        await mp.switchTab('/pages/home/home')
        await sleep(2000)
        return mp.navigateTo(`/pages/finish/today?${finishReciteQuery}`)
      },
      waitMs: 4000
    },
    {
      key: 'finish-recite',
      file: '06-finish-recite.png',
      label: '完成跟读背诵',
      navigate: async (mp) => {
        await mp.switchTab('/pages/home/home')
        await sleep(2000)
        return mp.navigateTo(`/pages/finish/today?${finishReciteQuery}`)
      },
      waitMs: 4000
    },
    {
      key: 'finish-listen',
      file: '06-finish-listen.png',
      label: '通关关卡小测',
      navigate: async (mp) => {
        await mp.switchTab('/pages/home/home')
        await sleep(2000)
        return mp.navigateTo(`/pages/finish/today?${finishListenQuery}`)
      },
      waitMs: 4000
    },
    {
      key: 'plan',
      file: '06-plan.png',
      label: '学习计划',
      navigate: (mp) => mp.navigateTo(`/pages/plan/plan?${buildQuery({ wordCount: 1413, resBookId, name: bookName })}`),
      waitMs: 4000
    },
    {
      key: 'today',
      file: '07-today-route.png',
      label: '今日 · 学习路线',
      navigate: (mp) => mp.switchTab('/pages/today/today'),
      waitMs: 5500
    },
    {
      key: 'onboarding',
      file: '07-onboarding.png',
      label: '新手引导 · 选年级',
      navigate: (mp) => mp.navigateTo('/pages/onboarding/onboarding?edit=1'),
      waitMs: 3500
    },
    {
      key: 'membership',
      file: '07-membership.png',
      label: '开通会员',
      navigate: (mp) => mp.navigateTo(`/pages/membership/membership?${buildQuery({ resBookId, name: bookName })}`),
      waitMs: 4500
    },
    {
      key: 'exam',
      file: '07-exam-entry.png',
      label: '入门测',
      navigate: (mp) => mp.navigateTo(`/pages/exam/exam?${buildQuery({ type: 'entry', resBookId, name: bookName })}`),
      waitMs: 4500
    },
    {
      key: 'exam-report',
      file: '07-exam-report.png',
      label: '入门测报告',
      navigate: (mp) => mp.navigateTo(`/pages/exam/exam-report?${buildQuery({ type: 'entry', resBookId, name: bookName })}`),
      waitMs: 4000,
      prepareBeforeNavigate: async (page, mp, ctx) => {
        await mp.evaluate((bookId) => {
          const key = `exam_result_${bookId || 'default'}_entry`
          wx.setStorageSync(key, {
            total: 20,
            correct: 17,
            accuracy: 85,
            wordAccuracy: 88,
            wordCorrect: 14,
            wordTotal: 16,
            sentenceAccuracy: 75,
            sentenceCorrect: 3,
            sentenceTotal: 4,
            byType: [
              { label: '词义选择', accuracy: 90, correct: 9, total: 10 },
              { label: '听音选词', accuracy: 80, correct: 4, total: 5 }
            ],
            wrong: [],
            practiceSeconds: 480,
            practiceTimeText: '8分',
            ts: Date.now()
          })
        }, ctx.resBookId)
      }
    },
    {
      key: 'report',
      file: '07-unit-report.png',
      label: '关卡学习报告',
      navigate: (mp) => mp.navigateTo(`/pages/report/report?${buildQuery({ sort: unitSort || 1, words: 12, en: 'Practice makes perfect.', zh: '熟能生巧。' })}`),
      waitMs: 4000
    },
    {
      key: 'study-record',
      file: '07-study-record.png',
      label: '学习记录',
      navigate: (mp) => mp.navigateTo('/pages/study-record/record'),
      waitMs: 4500
    }
  ]
}

async function shot(miniProgram, item) {
  const dest = path.join(outDir, item.file)
  console.log(`→ ${item.label} (${item.file})`)
  if (item.prepareBeforeNavigate) {
    const page = await miniProgram.currentPage()
    await item.prepareBeforeNavigate(page, miniProgram, item._ctx || {})
  }
  await item.navigate(miniProgram)
  await sleep(item.waitMs || 3000)
  const page = await miniProgram.currentPage()
  if (item.prepare) {
    const ctx = item._ctx || {}
    await item.prepare(page, miniProgram, ctx)
  }
  await miniProgram.screenshot({ path: dest })
  const stat = fs.statSync(dest)
  const kb = stat.size / 1024
  const minKb = item.minKb || 20
  if (kb < minKb) {
    throw new Error(`screenshot too small (${kb.toFixed(1)} KB < ${minKb} KB), page may be blank`)
  }
  console.log(`  ✓ ${kb.toFixed(1)} KB`)
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  console.log('Launching WeChat DevTools automator…')
  console.log(`Project: ${projectRoot}`)

  const miniProgram = await automator.launch({
    cliPath,
    projectPath: projectRoot,
    timeout: 120000
  })

  try {
    const ctx = await bootstrapContext(miniProgram)
    let shots = makeShots(ctx)
    if (onlyKeys) {
      shots = shots.filter((s) => onlyKeys.includes(s.key))
      if (!shots.length) {
        throw new Error(`No shots matched --only=${onlyKeys.join(',')}`)
      }
    }

    for (const item of shots) {
      item._ctx = ctx
      try {
        await shot(miniProgram, item)
      } catch (err) {
        console.error(`  ✗ failed: ${err.message}`)
      }
    }
  } finally {
    await miniProgram.close()
  }

  console.log('\nDone. Screenshots saved to docs/images/mini-app/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
