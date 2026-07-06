// 邀请关系：入口参数解析 + 待绑定邀请码暂存。
// 三种进入方式统一在 app.onShow 捕获：
//  - 海报小程序码：getUnlimited 的 scene = "i=<邀请码>"（≤32 可见字符），场景值 1047/1048/1049
//  - 微信分享卡片：path 带 ?inviteCode=<邀请码>，场景值 1007/1008
//  - 手动输入：新手引导第 3 步输入框（兜底）
// 新用户（未完成引导）把参数暂存到 pendingInvite，引导第 3 步回显、可修改；
// 完成引导时由 onboarding 调 bindInviteCode 绑定并锁定，之后不可更改。
// 老用户（已有学生档案）进入时直接忽略参数，不重复归因。
const { hasStudentProfile } = require('./student-profile')

const PENDING_INVITE_KEY = 'pendingInvite'

const INVITE_SOURCE_QRCODE = 'qrcode'
const INVITE_SOURCE_SHARE = 'share'
const INVITE_SOURCE_MANUAL = 'manual'

// 邀请码：4-10 位大写字母 + 数字（生成时已去掉 0/O/1/I 易混字符，校验放宽）
function normalizeInviteCode(code) {
  const value = String(code || '').trim().toUpperCase()
  return /^[A-Z0-9]{4,10}$/.test(value) ? value : ''
}

// scene 原样透传时可能被 encodeURIComponent，先解码再取 i=<code>
function parseSceneInviteCode(scene) {
  let value = String(scene || '')
  try {
    value = decodeURIComponent(value)
  } catch (error) {
    // 保留原值继续解析
  }
  const matched = value.match(/(?:^|[&,])i=([A-Za-z0-9]+)/)
  return normalizeInviteCode(matched ? matched[1] : '')
}

// 从启动参数（onShow/onLaunch 的 options.query）提取邀请码与来源
function parseInviteFromLaunchOptions(options) {
  const query = (options && options.query) || {}
  const fromQuery = normalizeInviteCode(query.inviteCode)
  if (fromQuery) {
    return { code: fromQuery, source: INVITE_SOURCE_SHARE }
  }
  const fromScene = parseSceneInviteCode(query.scene)
  if (fromScene) {
    return { code: fromScene, source: INVITE_SOURCE_QRCODE }
  }
  return null
}

function getPendingInvite() {
  const pending = wx.getStorageSync(PENDING_INVITE_KEY)
  if (!pending || typeof pending !== 'object') {
    return null
  }
  const code = normalizeInviteCode(pending.code)
  if (!code) {
    return null
  }
  return {
    code,
    source: pending.source || INVITE_SOURCE_MANUAL,
    at: Number(pending.at) || 0
  }
}

function setPendingInvite(code, source) {
  const normalized = normalizeInviteCode(code)
  if (!normalized) {
    return null
  }
  const pending = {
    code: normalized,
    source: source || INVITE_SOURCE_MANUAL,
    at: Date.now()
  }
  wx.setStorageSync(PENDING_INVITE_KEY, pending)
  return pending
}

function clearPendingInvite() {
  wx.removeStorageSync(PENDING_INVITE_KEY)
}

// app.onShow 调用：新用户带参进入时暂存待绑定码（多次进入以最后一次为准）
function captureInviteLaunch(options) {
  const parsed = parseInviteFromLaunchOptions(options)
  if (!parsed) {
    return null
  }
  if (hasStudentProfile()) {
    // 已完成引导的老用户不建立邀请关系
    return null
  }
  return setPendingInvite(parsed.code, parsed.source)
}

// 邀请记录里的来源展示文案
function describeInviteSource(source) {
  if (source === INVITE_SOURCE_QRCODE) {
    return '扫海报码'
  }
  if (source === INVITE_SOURCE_SHARE) {
    return '分享卡片'
  }
  return '填邀请码'
}

module.exports = {
  INVITE_SOURCE_QRCODE,
  INVITE_SOURCE_SHARE,
  INVITE_SOURCE_MANUAL,
  captureInviteLaunch,
  clearPendingInvite,
  describeInviteSource,
  getPendingInvite,
  normalizeInviteCode,
  parseInviteFromLaunchOptions,
  parseSceneInviteCode,
  setPendingInvite
}
