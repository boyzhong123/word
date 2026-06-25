// ── 单一 mock 数据层（演示用「假后端」）────────────────────────────────────
// 目标：业务真值（会员 / 已购词书 / 会员订单 / 学生档案 / 学习形象 / 学习计划 /
//   今日打卡进度）不再由各业务工具散落写入本地 Storage，而是统一收口到这一层。
//
// USE_MOCK = true（当前）：读写都走内存快照，并「隔离持久化」到单一键 __mock_state__；
//   页面与业务工具不直接碰 Storage。演示时开通 / 打卡跨重启仍保留，reset() 一键清空。
//
// USE_MOCK = false（接后端）：本层短路为纯内存缓存、零 Storage；业务真值改由
//   utils/api.js 从后端拉取后 hydrate() 进来，写入则改为调后端接口（见接口文档）。
//
// 每个 slice 的结构对齐 docs/mini-app-tech-doc.html 的接口响应。切后端只需把
// USE_MOCK 置 false，并在 utils/api.js 把对应 getter 接上真实接口即可。

const STATE_KEY = '__mock_state__'

// 旧版散落键：首次升级时一次性清理，避免历史残留（如残留会员态导致「非 VIP 显示金色」）
const LEGACY_KEYS = ['membership', 'membership_orders', 'devPurchasedBooks', 'studentProfile', 'characterGender', 'checkinRemindCount', 'listeningQuizWrongWords']
const LEGACY_PREFIXES = ['studyPlan_', 'dailyProgress_', 'subscribePref_', 'exam_result_']

// 接后端时改为 false。也可在此读环境变量/灰度开关决定。
const USE_MOCK = true

// 初始演示快照（演示默认：非会员、未购、未打卡、未填档案 → 走完整新手路径）
function defaultState() {
  return {
    // GET /mini-app/membership
    membership: { tierId: '', months: 0, expireAt: 0, updatedAt: 0 },
    // POST 购买成功后由后端记录的已购词书 id
    purchasedBookIds: [],
    // GET /mini-app/membership/orders
    membershipOrders: [],
    // 学生档案（onboarding 采集，真实走 user/info）—— null 表示未采集
    studentProfile: null,
    // 学习形象性别（onboarding 采集）—— '' 表示未采集，按 boy 兜底
    characterGender: '',
    // 学习形象图组（后端可下发覆盖：运营换形象不发版）—— null 表示用前端 bundled 默认图
    // 结构：{ boy: { hero, todayHero, pkSprite }, girl: {…} }
    characterAssets: null,
    // 学习计划：{ [resBookId]: { groupsPerDay, levelSize, dailyWords, totalLevels, updatedAt } }
    studyPlans: {},
    // 今日打卡进度：{ [resBookId]: { date, units: [] } }
    dailyProgress: {},
    // 入门测提示弹窗记录（按词书，每天最多弹一次）：{ [resBookId]: { lastPromptedDate: 'YYYY-MM-DD' } }
    // 接后端：由服务器记录/返回，前端只读 lastPromptedDate 判断今天是否已弹
    entryExamPrompts: {},
    // 订阅提醒偏好（建议 user/info.subscribePrefs 下发）：{ [prefKey]: 0|1 }
    subscribePrefs: {},
    // 订阅提醒累计额度（一次性订阅囤的次数，供后端累计/扣减）：{ [countKey]: number }
    subscribeQuota: {},
    // 听音小测错词本（学习数据，接后端上报错词 / 复习走 review-words）：[{ wordId|word, ... }]
    listeningWrongWords: [],
    // 入门测/结业测成绩（学习评测数据，接后端 exam-result）：{ ['<resBookId>_<type>']: result }
    examResults: {}
  }
}

let cache = null

function hasWx() {
  return typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function'
}

// 首次升级：清掉旧的散落业务键，从干净演示态开始
function migrateLegacy() {
  if (!hasWx()) {
    return
  }
  try {
    LEGACY_KEYS.forEach(key => wx.removeStorageSync(key))
    const info = typeof wx.getStorageInfoSync === 'function' ? wx.getStorageInfoSync() : null
    const keys = (info && info.keys) || []
    keys.forEach(key => {
      if (LEGACY_PREFIXES.some(prefix => key.indexOf(prefix) === 0)) {
        wx.removeStorageSync(key)
      }
    })
  } catch (error) {
    // 清理失败不影响主流程
  }
}

function load() {
  if (cache) {
    return cache
  }
  cache = defaultState()
  if (!USE_MOCK || !hasWx()) {
    // 接后端模式：纯内存，等 hydrate() 灌入；不读写 Storage
    return cache
  }
  let saved = null
  try {
    saved = wx.getStorageSync(STATE_KEY)
  } catch (error) {
    saved = null
  }
  if (saved && typeof saved === 'object') {
    cache = Object.assign(defaultState(), saved)
  } else {
    // 没有 mock 快照 = 首次升级：清理旧键、落一份干净演示态
    migrateLegacy()
    persist()
  }
  return cache
}

function persist() {
  if (!USE_MOCK || !hasWx()) {
    return
  }
  try {
    wx.setStorageSync(STATE_KEY, cache)
  } catch (error) {
    // 持久化失败不影响内存读写
  }
}

// 读一个 slice（返回内部引用，调用方改完请配合 setSlice 落盘）
function getSlice(key) {
  return load()[key]
}

// 写一个 slice 并落盘（mock 模式持久化到 __mock_state__；接后端模式仅内存）
function setSlice(key, value) {
  load()[key] = value
  persist()
  return value
}

// 接后端用：把后端拉到的业务真值灌入内存缓存（不持久化）
function hydrate(partial) {
  const state = load()
  Object.keys(partial || {}).forEach(key => {
    state[key] = partial[key]
  })
  return state
}

// 一键清空演示态（回到初始非会员/未打卡），用于「重置演示」入口
function reset() {
  cache = defaultState()
  persist()
  return cache
}

module.exports = {
  USE_MOCK,
  MOCK_STATE_KEY: STATE_KEY,
  defaultState,
  getSlice,
  setSlice,
  hydrate,
  reset
}
