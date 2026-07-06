// 邀请海报：品牌蓝渐变背景 + 头像昵称 + 学习数据（社交证明）+ 带参小程序码 + 邀请码。
// 布局基于 600x960 逻辑像素，导出时按 dpr 放大。视觉稿见 mockups/invite-friends-mockup.html
const { APP_NAME } = require('../../utils/app-brand')

const POSTER_WIDTH = 600
const POSTER_HEIGHT = 960

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

function drawBackground(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT)
  sky.addColorStop(0, '#1f6fd6')
  sky.addColorStop(0.38, '#2f80ed')
  sky.addColorStop(0.7, '#4aa0f5')
  sky.addColorStop(1, '#8ec8ff')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

  // 装饰圆点，弱透明度不抢主体
  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)'
  ctx.beginPath()
  ctx.arc(540, 140, 130, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(60, 420, 90, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.beginPath()
  ctx.arc(480, 520, 60, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

const LOGO_X = 48
const LOGO_Y = 46
const LOGO_SIZE = 52
const LOGO_RADIUS = 11
const LOGO_PAD = 2

function drawLogoBadge(ctx, logoImage) {
  ctx.save()
  ctx.shadowColor = 'rgba(15, 47, 92, 0.35)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 2
  roundRectPath(ctx, LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE, LOGO_RADIUS)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  const inner = LOGO_SIZE - LOGO_PAD * 2
  roundRectPath(ctx, LOGO_X + LOGO_PAD, LOGO_Y + LOGO_PAD, inner, inner, Math.max(7, LOGO_RADIUS - 1))
  ctx.clip()
  ctx.drawImage(logoImage, LOGO_X + LOGO_PAD, LOGO_Y + LOGO_PAD, inner, inner)
  ctx.restore()
}

function drawHeader(ctx, logoImage) {
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(15, 47, 92, 0.35)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  if (logoImage) {
    drawLogoBadge(ctx, logoImage)
  }
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px sans-serif'
  ctx.fillText(APP_NAME, logoImage ? 114 : 48, 82)
  ctx.font = '20px sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.fillText('小学英语 · 同步教材', 114, 112)
  ctx.restore()
}

function drawIdentity(ctx, options, avatarImage) {
  // 头像（圆形裁剪），加载失败画占位圆
  ctx.save()
  ctx.beginPath()
  ctx.arc(84, 218, 36, 0, Math.PI * 2)
  ctx.closePath()
  if (avatarImage) {
    ctx.clip()
    ctx.drawImage(avatarImage, 48, 182, 72, 72)
  } else {
    ctx.fillStyle = '#ffd66b'
    ctx.fill()
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(84, 218, 36, 0, Math.PI * 2)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px sans-serif'
  ctx.fillText(options.nickName, 138, 214)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
  ctx.fillText('邀请你一起学英语', 138, 248)
}

// 主文案分段绘制：数字用金色高亮
function drawClaimLine(ctx, segments, y) {
  let x = 48
  segments.forEach(segment => {
    ctx.fillStyle = segment.em ? '#ffe08a' : '#ffffff'
    ctx.fillText(segment.text, x, y)
    x += ctx.measureText(segment.text).width
  })
}

function drawClaim(ctx, options) {
  ctx.save()
  ctx.textAlign = 'left'
  ctx.font = 'bold 40px sans-serif'
  ctx.shadowColor = 'rgba(15, 47, 92, 0.3)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  const continuousDays = Math.max(Number(options.continuousDays) || 0, 0)
  const learnedWords = Math.max(Number(options.learnedWords) || 0, 0)
  if (continuousDays > 0 || learnedWords > 0) {
    drawClaimLine(ctx, [
      { text: '我在这里坚持打卡 ' },
      { text: String(continuousDays), em: true },
      { text: ' 天' }
    ], 336)
    drawClaimLine(ctx, [
      { text: '记牢了 ' },
      { text: String(learnedWords), em: true },
      { text: ' 个单词' }
    ], 396)
  } else {
    // 新账号无数据时退化为纯邀请文案
    drawClaimLine(ctx, [{ text: '每天 10 分钟' }], 336)
    drawClaimLine(ctx, [{ text: '把英语学扎实' }], 396)
  }
  ctx.restore()
}

function drawStats(ctx, options) {
  const stats = [
    { value: Math.max(Number(options.continuousDays) || 0, 0), label: '连续打卡(天)' },
    { value: Math.max(Number(options.learnedWords) || 0, 0), label: '累计学词(个)' },
    { value: Math.max(Number(options.studyMinutes) || 0, 0), label: '学习分钟(分)' }
  ]
  const chipWidth = 160
  const chipHeight = 118
  const gap = 12
  const startX = 48
  const top = 448

  ctx.save()
  ctx.textAlign = 'center'
  stats.forEach((stat, index) => {
    const x = startX + index * (chipWidth + gap)
    roundRectPath(ctx, x, top, chipWidth, chipHeight, 18)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)'
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 38px sans-serif'
    ctx.fillText(String(stat.value), x + chipWidth / 2, top + 56)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
    ctx.font = '19px sans-serif'
    ctx.fillText(stat.label, x + chipWidth / 2, top + 92)
  })
  ctx.restore()
}

// 底部白卡：左侧引导文案 + 邀请码，右侧带参小程序码
function drawFooterCard(ctx, options, qrImage) {
  const cardX = 48
  const cardY = 640
  const cardWidth = POSTER_WIDTH - cardX * 2
  const cardHeight = 250

  ctx.save()
  ctx.shadowColor = 'rgba(15, 47, 92, 0.25)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6
  roundRectPath(ctx, cardX, cardY, cardWidth, cardHeight, 24)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.textAlign = 'left'
  ctx.fillStyle = '#151515'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText('长按识别小程序码', cardX + 32, cardY + 66)
  ctx.fillStyle = '#8a94a6'
  ctx.font = '21px sans-serif'
  ctx.fillText('和我一起每天 10 分钟', cardX + 32, cardY + 108)
  ctx.fillText('同步教材 · 听读背测', cardX + 32, cardY + 142)
  ctx.fillStyle = '#2f80ed'
  ctx.font = 'bold 26px sans-serif'
  ctx.fillText('邀请码 ' + (options.inviteCode || ''), cardX + 32, cardY + 198)
  ctx.restore()

  // 小程序码：白底圆角 + 细边框
  const qrSize = 168
  const qrX = cardX + cardWidth - qrSize - 28
  const qrY = cardY + (cardHeight - qrSize) / 2
  ctx.save()
  roundRectPath(ctx, qrX, qrY, qrSize, qrSize, 16)
  ctx.strokeStyle = '#e8ecf3'
  ctx.lineWidth = 2
  ctx.stroke()
  if (qrImage) {
    roundRectPath(ctx, qrX + 6, qrY + 6, qrSize - 12, qrSize - 12, 12)
    ctx.clip()
    ctx.drawImage(qrImage, qrX + 6, qrY + 6, qrSize - 12, qrSize - 12)
  }
  ctx.restore()

  ctx.save()
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.font = '19px sans-serif'
  ctx.fillText('好友完成新手引导，即算邀请成功', POSTER_WIDTH / 2, cardY + cardHeight + 42)
  ctx.restore()
}

// 绘制完整海报，resolve 时画布已就绪可导出
function drawInvitePoster(canvas, options) {
  const dpr = Math.max(Number(options.dpr) || 2, 1)
  const ctx = canvas.getContext('2d')
  canvas.width = POSTER_WIDTH * dpr
  canvas.height = POSTER_HEIGHT * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)

  return Promise.all([
    loadCanvasImage(canvas, options.avatarSrc),
    loadCanvasImage(canvas, options.logoSrc),
    loadCanvasImage(canvas, options.qrSrc)
  ]).then(images => {
    drawBackground(ctx)
    drawHeader(ctx, images[1])
    drawIdentity(ctx, options, images[0])
    drawClaim(ctx, options)
    drawStats(ctx, options)
    drawFooterCard(ctx, options, images[2])
  })
}

module.exports = {
  POSTER_WIDTH,
  POSTER_HEIGHT,
  drawInvitePoster
}
