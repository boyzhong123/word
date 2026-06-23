// 会员制（按时长开通，单一会员解锁全部内容）。
// 现阶段支付为本地模拟，会员状态与到期时间记录在本地 storage，不依赖后端。
// 计费档位：1 个月 ¥39 / 2 个月 ¥59 / 1 年 ¥109。
const STORAGE_KEY = 'membership'

const MEMBERSHIP_TIERS = [
  { id: 'm1', name: '1个月', months: 1, price: 39, sub: '尝鲜体验' },
  { id: 'm2', name: '2个月', months: 2, price: 59, sub: '超值之选', tag: '超值' },
  { id: 'y1', name: '1年', months: 12, price: 109, sub: '低至 9 元/月', tag: '推荐' }
]

const DEFAULT_TIER_ID = 'y1'

function getTier(tierId) {
  return MEMBERSHIP_TIERS.find(item => item.id === tierId) || null
}

function getDefaultTier() {
  return getTier(DEFAULT_TIER_ID) || MEMBERSHIP_TIERS[0]
}

// 给定起点时间，叠加 months 个月（按自然月推进，跨年自动进位）
function addMonths(baseTime, months) {
  const date = new Date(baseTime)
  date.setMonth(date.getMonth() + Math.max(0, Math.floor(months)))
  return date.getTime()
}

function readMembership() {
  const raw = wx.getStorageSync(STORAGE_KEY)
  if (raw && typeof raw === 'object') {
    return raw
  }
  return null
}

// 当前会员状态：active 表示在有效期内
function getMembership() {
  const raw = readMembership()
  const expireAt = raw && Number(raw.expireAt) ? Number(raw.expireAt) : 0
  const active = expireAt > Date.now()
  const tier = raw ? getTier(raw.tierId) : null
  return {
    active,
    expireAt,
    tierId: raw ? raw.tierId || '' : '',
    tierName: tier ? tier.name : '',
    expireText: expireAt ? formatDate(expireAt) : ''
  }
}

function isMember() {
  return getMembership().active
}

function formatDate(time) {
  const date = new Date(time)
  const pad = value => String(value).padStart(2, '0')
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
}

// 开通/续费：从「当前到期时间与现在的较大值」往后叠加时长，支持续费叠加
function activateMembership(tierId) {
  const tier = getTier(tierId) || getDefaultTier()
  const current = getMembership()
  const base = current.active && current.expireAt > Date.now() ? current.expireAt : Date.now()
  const expireAt = addMonths(base, tier.months)
  wx.setStorageSync(STORAGE_KEY, {
    tierId: tier.id,
    months: tier.months,
    expireAt,
    updatedAt: Date.now()
  })
  return getMembership()
}

// 按任意时长开通/续费（用于商品页 SKU 弹窗：6 个月 / 永久等不在档位内的有效期）。
// months 传一个很大的值即近似「永久」。
function activateMembershipForMonths(months, meta) {
  const safeMonths = Math.max(1, Math.floor(Number(months) || 0))
  const current = getMembership()
  const base = current.active && current.expireAt > Date.now() ? current.expireAt : Date.now()
  const expireAt = addMonths(base, safeMonths)
  wx.setStorageSync(STORAGE_KEY, {
    tierId: (meta && meta.tierId) || '',
    months: safeMonths,
    expireAt,
    updatedAt: Date.now()
  })
  return getMembership()
}

function clearMembership() {
  wx.removeStorageSync(STORAGE_KEY)
}

module.exports = {
  MEMBERSHIP_TIERS,
  DEFAULT_TIER_ID,
  getTier,
  getDefaultTier,
  getMembership,
  isMember,
  activateMembership,
  activateMembershipForMonths,
  clearMembership
}
