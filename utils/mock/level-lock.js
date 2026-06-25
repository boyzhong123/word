// ── 关卡锁状态：唯一规则源 + 给关卡盖章成字段 ──────────────────────────────
// 目标：页面只读字段、不再自己算「该不该锁」。锁规则只存在这一处（数据层），
// 由 mock-store 的会员态（演示用「假后端」字段）驱动 —— 即「mock 数据提供字段控制」。
//
// 规则（同步写进接口文档；后端可直接在 book-units 每关下发这些字段，前端零改）：
//   · 第 1 关（sort===1）永久免费
//   · 复习关（isReview）：跟随会员（会员解锁、非会员锁）
//   · 其余关：需会员
//
// 接后端：把这些字段交给后端在 book-units 下发，本模块退化为「字段缺失时的兜底计算」。
const { getMembership } = require('../membership')

const FREE_LEVEL_SORT = 1

function toSort(value) {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) ? n : 0
}

function isFreeLevel(sort) {
  return toSort(sort) === FREE_LEVEL_SORT
}

// 单关 VIP/免费解锁判定（只管会员/免费规则，不含「前序未完成」的进度锁）。
// member 可显式传入以避免在循环里重复读 store。
function isUnitUnlocked(unit, member) {
  const active = typeof member === 'boolean' ? member : getMembership().active
  if (unit && unit.isReview) {
    return active
  }
  return isFreeLevel(unit && unit.sort) || active
}

// 给一组关卡盖章锁字段，页面读 unit.unlocked / unit.lockedByVip / unit.requiresVip。
// 已带后端下发 unlocked 字段的关卡原样保留（后端优先），仅给缺失的补算。
function stampUnits(units) {
  const member = getMembership().active
  return (Array.isArray(units) ? units : []).map(unit => {
    const item = unit || {}
    const unlocked = typeof item.unlocked === 'boolean'
      ? item.unlocked
      : isUnitUnlocked(item, member)
    return Object.assign({}, item, {
      isFreeLevel: isFreeLevel(item.sort),
      unlocked,
      lockedByVip: !unlocked,
      requiresVip: !unlocked && !item.isReview
    })
  })
}

// 兼容旧调用：仅按 sort（无 unit 上下文，按普通关规则）。
function isLevelUnlocked(sort) {
  return isFreeLevel(sort) || getMembership().active
}

function isLevelLocked(sort) {
  return !isLevelUnlocked(sort)
}

module.exports = {
  FREE_LEVEL_SORT,
  isFreeLevel,
  isUnitUnlocked,
  stampUnits,
  isLevelUnlocked,
  isLevelLocked
}
