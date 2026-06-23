// 关卡解锁规则：第 1 关（sort===1）始终免费，可完整体验新学/背诵/小测；
// 其余关卡需要开通会员。随身听同理，免费用户仅可听第 1 关。
const { isMember } = require('./membership')

const FREE_LEVEL_SORT = 1

function toSort(value) {
  const sort = Math.floor(Number(value))
  return Number.isFinite(sort) ? sort : 0
}

// 是否为免费关卡（第一关）
function isFreeLevel(sort) {
  return toSort(sort) === FREE_LEVEL_SORT
}

// 该关卡当前是否解锁：免费关卡或已开通会员
function isLevelUnlocked(sort) {
  return isFreeLevel(sort) || isMember()
}

// 该关卡是否被锁（用于展示锁标 / 拦截进入）
function isLevelLocked(sort) {
  return !isLevelUnlocked(sort)
}

module.exports = {
  FREE_LEVEL_SORT,
  isFreeLevel,
  isLevelUnlocked,
  isLevelLocked
}
