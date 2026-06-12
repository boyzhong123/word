// 打卡分享海报：主题背景图 + 日期励志语 + 打卡数据，canvas 2d 绘制。
// 布局基于 600x960 逻辑像素，导出时按 dpr 放大。

const POSTER_WIDTH = 600
const POSTER_HEIGHT = 960
const APP_NAME = '词句刷刷刷'
const POSTER_THEMES = ['monster', 'pk', 'words', 'monsterLight', 'pkLight', 'wordsLight']
const LIGHT_POSTER_THEMES = ['monsterLight', 'pkLight', 'wordsLight']
// 占位小程序码（scripts 外手动生成）：上线前替换为 getwxacodeunlimit 生成的官方小程序码
const POSTER_QR_SRC = '/images/checkin/share-qrcode.png'

const POSTER_BACKGROUNDS = {
  today: {
    monster: '/images/checkin/share-bg-today-monster.png',
    pk: '/images/checkin/share-bg-today-pk.png',
    words: '/images/checkin/share-bg-today-words.png',
    monsterLight: '/images/checkin/share-bg-today-monster-light.png',
    pkLight: '/images/checkin/share-bg-today-pk-light.png',
    wordsLight: '/images/checkin/share-bg-today-words-light.png'
  },
  streak: {
    monster: '/images/checkin/share-bg-streak-monster.png',
    pk: '/images/checkin/share-bg-streak-pk.png',
    words: '/images/checkin/share-bg-streak-words.png',
    monsterLight: '/images/checkin/share-bg-streak-monster-light.png',
    pkLight: '/images/checkin/share-bg-streak-pk-light.png',
    wordsLight: '/images/checkin/share-bg-streak-words-light.png'
  }
}

const DAILY_QUOTES = [
  { en: 'Keep going. Each step counts.', cn: '继续前进。每一步都重要。' },
  { en: 'Little by little, one travels far.', cn: '积跬步，方能至千里。' },
  { en: 'Practice makes perfect.', cn: '熟能生巧。' },
  { en: 'The best time to start is now.', cn: '最好的开始时间，就是现在。' },
  { en: 'Slow and steady wins the race.', cn: '稳扎稳打，方能取胜。' },
  { en: 'Every day is a fresh start.', cn: '每一天都是新的开始。' },
  { en: 'Small habits, big results.', cn: '小小习惯，大大改变。' },
  { en: 'Stars can not shine without darkness.', cn: '没有黑暗，星光便无从闪耀。' },
  { en: 'Well begun is half done.', cn: '良好的开端是成功的一半。' },
  { en: 'Learning is a treasure forever.', cn: '学问是受用一生的财富。' },
  { en: 'Constant dripping wears away a stone.', cn: '滴水穿石，贵在坚持。' },
  { en: 'Today\'s effort, tomorrow\'s strength.', cn: '今日的努力，是明天的底气。' },
  { en: 'No pain, no gain.', cn: '一分耕耘，一分收获。' },
  { en: 'A journey of a thousand miles begins with a single step.', cn: '千里之行，始于足下。' }
]

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatPosterDate(date) {
  const target = date instanceof Date ? date : new Date()
  return [
    target.getFullYear(),
    pad(target.getMonth() + 1),
    pad(target.getDate())
  ].join('.')
}

function dayOfYear(date) {
  const target = date instanceof Date ? date : new Date()
  const start = new Date(target.getFullYear(), 0, 1)
  return Math.floor((target - start) / (24 * 60 * 60 * 1000))
}

// 每天固定一条励志语，同一天多次打开保持一致
function getDailyQuote(date) {
  return DAILY_QUOTES[dayOfYear(date) % DAILY_QUOTES.length]
}

// 海报主文案与数据列（口径见 mockups/checkin-share-mockup.html）：
// 今日打卡强调「今天学了 N 个单词」走当日口径，累计打卡强调「连续 N 天」走累计口径
function buildPosterText(options) {
  const continuousDays = Math.max(Number(options.continuousDays) || 0, 0)
  const totalDays = Math.max(Number(options.totalDays) || 0, continuousDays)
  const todayDone = Math.max(Number(options.todayDone) || 0, 0)
  const todayWords = Math.max(Number(options.todayWords) || 0, 0)
  const learnedWords = Math.max(Number(options.learnedWords) || 0, 0)

  if (options.mode === 'today') {
    return {
      headline: ['我在『' + APP_NAME + '』', '今天学了 ' + todayWords + ' 个单词'],
      stats: [
        { value: todayWords, label: '今日学习(个)' },
        { value: todayDone, label: '今日关卡(关)' },
        { value: continuousDays, label: '连续打卡(天)' }
      ]
    }
  }

  return {
    headline: ['我在『' + APP_NAME + '』', '已连续打卡学习 ' + continuousDays + ' 天'],
    stats: [
      { value: learnedWords, label: '累计掌握(个)' },
      { value: totalDays, label: '累计天数(天)' },
      { value: continuousDays, label: '连续打卡(天)' }
    ]
  }
}

// 可复现的伪随机数（星星位置每次绘制保持一致）
function createRandom(seed) {
  let state = seed % 2147483647
  if (state <= 0) {
    state += 2147483646
  }
  return function () {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function loadCanvasImage(canvas, src) {
  return new Promise(resolve => {
    if (!src) {
      resolve(null)
      return
    }
    const image = canvas.createImage()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function normalizePosterTheme(theme) {
  return POSTER_THEMES.indexOf(theme) >= 0 ? theme : POSTER_THEMES[0]
}

function isLightPosterTheme(theme) {
  return LIGHT_POSTER_THEMES.indexOf(normalizePosterTheme(theme)) >= 0
}

function getPosterBackgroundSrc(mode, theme) {
  const backgrounds = POSTER_BACKGROUNDS[mode] || POSTER_BACKGROUNDS.streak
  const key = normalizePosterTheme(theme)
  return backgrounds[key] || backgrounds.monster
}

function drawBackgroundImage(ctx, image) {
  if (!image) {
    drawSky(ctx)
    drawStars(ctx)
    drawMoon(ctx)
    drawMountains(ctx)
    drawWater(ctx)
    return
  }

  const targetRatio = POSTER_WIDTH / POSTER_HEIGHT
  const srcRatio = image.width / image.height
  let sx = 0
  let sy = 0
  let sw = image.width
  let sh = image.height
  if (srcRatio > targetRatio) {
    sh = image.height
    sw = image.height * targetRatio
    sx = (image.width - sw) / 2
  } else {
    sw = image.width
    sh = image.width / targetRatio
    sy = (image.height - sh) / 2
  }
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, POSTER_WIDTH, POSTER_HEIGHT)
}

function drawSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT)
  sky.addColorStop(0, '#1e1b4b')
  sky.addColorStop(0.42, '#4c1d95')
  sky.addColorStop(0.62, '#6d28d9')
  sky.addColorStop(1, '#17123a')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)
}

function drawStars(ctx) {
  const random = createRandom(20260612)
  ctx.save()
  for (let i = 0; i < 46; i++) {
    const x = random() * POSTER_WIDTH
    const y = random() * 400
    const radius = 0.6 + random() * 1.6
    ctx.globalAlpha = 0.35 + random() * 0.6
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawMoon(ctx) {
  const glow = ctx.createRadialGradient(468, 168, 30, 468, 168, 120)
  glow.addColorStop(0, 'rgba(248, 232, 200, 0.4)')
  glow.addColorStop(1, 'rgba(248, 232, 200, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(468, 168, 120, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f8e8c8'
  ctx.beginPath()
  ctx.arc(468, 168, 52, 0, Math.PI * 2)
  ctx.fill()
}

function drawMountains(ctx) {
  ctx.fillStyle = 'rgba(46, 16, 101, 0.9)'
  ctx.beginPath()
  ctx.moveTo(0, 540)
  ctx.quadraticCurveTo(110, 380, 230, 470)
  ctx.quadraticCurveTo(330, 540, 430, 480)
  ctx.quadraticCurveTo(530, 430, 600, 500)
  ctx.lineTo(600, 620)
  ctx.lineTo(0, 620)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#1c1040'
  ctx.beginPath()
  ctx.moveTo(0, 620)
  ctx.quadraticCurveTo(140, 440, 290, 545)
  ctx.quadraticCurveTo(420, 630, 600, 560)
  ctx.lineTo(600, 660)
  ctx.lineTo(0, 660)
  ctx.closePath()
  ctx.fill()
}

function drawWater(ctx) {
  const water = ctx.createLinearGradient(0, 600, 0, POSTER_HEIGHT)
  water.addColorStop(0, '#241a52')
  water.addColorStop(1, '#100d2c')
  ctx.fillStyle = water
  ctx.fillRect(0, 600, POSTER_WIDTH, POSTER_HEIGHT - 600)

  // 月亮倒影
  ctx.save()
  ctx.fillStyle = 'rgba(248, 232, 200, 0.18)'
  for (let i = 0; i < 4; i++) {
    const y = 620 + i * 22
    const width = 90 - i * 16
    ctx.beginPath()
    ctx.ellipse(468, y, width, 5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// 英文按单词折行，避免长励志语溢出海报
function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(' ')
  const lines = []
  let line = ''
  words.forEach(word => {
    const candidate = line ? line + ' ' + word : word
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })
  if (line) {
    lines.push(line)
  }
  return lines
}

function drawHeader(ctx, options, logoImage) {
  const light = isLightPosterTheme(options.theme)
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (light) {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.65)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 1
  } else {
    ctx.shadowColor = 'rgba(10, 8, 32, 0.55)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 2
  }

  if (logoImage) {
    ctx.drawImage(logoImage, 48, 42, 52, 52)
  }
  ctx.fillStyle = light ? '#1f2733' : '#ffffff'
  ctx.font = 'bold 30px sans-serif'
  ctx.fillText(APP_NAME, logoImage ? 114 : 48, 80)

  ctx.font = 'bold 50px sans-serif'
  ctx.fillText(formatPosterDate(options.date), 48, 164)

  ctx.font = 'bold 27px sans-serif'
  ctx.fillStyle = light ? 'rgba(31, 39, 51, 0.92)' : 'rgba(255, 255, 255, 0.96)'
  let quoteY = 216
  wrapText(ctx, options.quote.en, 504).forEach(line => {
    ctx.fillText(line, 48, quoteY)
    quoteY += 38
  })

  ctx.font = '22px sans-serif'
  ctx.fillStyle = light ? 'rgba(31, 39, 51, 0.72)' : 'rgba(255, 255, 255, 0.82)'
  ctx.fillText(options.quote.cn, 48, quoteY + 2)
  ctx.restore()
}

function drawPanel(ctx, theme) {
  const light = isLightPosterTheme(theme)
  if (light) {
    const panel = ctx.createLinearGradient(0, 560, 0, 700)
    panel.addColorStop(0, 'rgba(255, 255, 255, 0)')
    panel.addColorStop(1, 'rgba(255, 255, 255, 0.82)')
    ctx.fillStyle = panel
    ctx.fillRect(0, 560, POSTER_WIDTH, 140)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
    ctx.fillRect(0, 700, POSTER_WIDTH, POSTER_HEIGHT - 700)
    return
  }

  const panel = ctx.createLinearGradient(0, 560, 0, 700)
  panel.addColorStop(0, 'rgba(13, 11, 32, 0)')
  panel.addColorStop(1, 'rgba(13, 11, 32, 0.88)')
  ctx.fillStyle = panel
  ctx.fillRect(0, 560, POSTER_WIDTH, 140)
  ctx.fillStyle = 'rgba(13, 11, 32, 0.88)'
  ctx.fillRect(0, 700, POSTER_WIDTH, POSTER_HEIGHT - 700)
}

function drawIdentity(ctx, options, avatarImage) {
  const light = isLightPosterTheme(options.theme)
  // 头像（圆形裁剪），加载失败时画占位圆
  ctx.save()
  ctx.beginPath()
  ctx.arc(80, 632, 32, 0, Math.PI * 2)
  ctx.closePath()
  if (avatarImage) {
    ctx.clip()
    ctx.drawImage(avatarImage, 48, 600, 64, 64)
  } else {
    ctx.fillStyle = '#8b6cff'
    ctx.fill()
  }
  ctx.restore()
  ctx.strokeStyle = light ? 'rgba(31, 39, 51, 0.18)' : 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(80, 632, 32, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = light ? '#1f2733' : '#ffffff'
  ctx.textAlign = 'left'
  ctx.font = 'bold 26px sans-serif'
  ctx.fillText(options.nickName, 128, 642)

  const text = buildPosterText(options)
  ctx.font = 'bold 34px sans-serif'
  ctx.fillText(text.headline[0], 48, 710)
  ctx.fillText(text.headline[1], 48, 760)
}

function drawStats(ctx, options) {
  const light = isLightPosterTheme(options.theme)
  const text = buildPosterText(options)
  // 右侧让位给小程序码，三列整体左移收窄
  const columns = [100, 230, 360]

  ctx.textAlign = 'center'
  text.stats.forEach((stat, index) => {
    ctx.fillStyle = light ? '#1f2733' : '#ffffff'
    ctx.font = 'bold 40px sans-serif'
    ctx.fillText(String(stat.value), columns[index], 856)
    ctx.fillStyle = light ? 'rgba(31, 39, 51, 0.62)' : 'rgba(255, 255, 255, 0.68)'
    ctx.font = '19px sans-serif'
    ctx.fillText(stat.label, columns[index], 890)
  })
}

// 小程序码（圆形）：白色圆底 + 圆形裁剪的码图，与官方小程序码样式一致
function drawQrBlock(ctx, qrImage, theme) {
  const light = isLightPosterTheme(theme)
  const centerX = 500
  const centerY = 848
  const chipRadius = 58

  ctx.beginPath()
  ctx.arc(centerX, centerY, chipRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  if (qrImage) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, chipRadius - 6, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(qrImage, centerX - chipRadius + 6, centerY - chipRadius + 6, (chipRadius - 6) * 2, (chipRadius - 6) * 2)
    ctx.restore()
  }

  ctx.fillStyle = light ? 'rgba(31, 39, 51, 0.62)' : 'rgba(255, 255, 255, 0.7)'
  ctx.textAlign = 'center'
  ctx.font = '15px sans-serif'
  ctx.fillText('长按识别小程序', centerX, 932)
}

// 绘制完整海报，resolve 时画布已就绪可导出
function drawPoster(canvas, options) {
  const dpr = Math.max(Number(options.dpr) || 2, 1)
  const ctx = canvas.getContext('2d')
  canvas.width = POSTER_WIDTH * dpr
  canvas.height = POSTER_HEIGHT * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)

  const mode = options.mode === 'today' ? 'today' : 'streak'
  const theme = normalizePosterTheme(options.theme)

  return Promise.all([
    loadCanvasImage(canvas, getPosterBackgroundSrc(mode, theme)),
    loadCanvasImage(canvas, options.avatarSrc),
    loadCanvasImage(canvas, options.logoSrc || options.badgeSrc),
    loadCanvasImage(canvas, options.qrSrc || POSTER_QR_SRC)
  ]).then(images => {
    drawBackgroundImage(ctx, images[0])
    drawHeader(ctx, options, images[2])
    drawPanel(ctx, theme)
    drawIdentity(ctx, options, images[1])
    drawStats(ctx, options)
    drawQrBlock(ctx, images[3], theme)
  })
}

module.exports = {
  APP_NAME,
  POSTER_WIDTH,
  POSTER_HEIGHT,
  POSTER_THEMES,
  LIGHT_POSTER_THEMES,
  POSTER_BACKGROUNDS,
  buildPosterText,
  drawPoster,
  formatPosterDate,
  getDailyQuote,
  getPosterBackgroundSrc,
  isLightPosterTheme,
  normalizePosterTheme
}
