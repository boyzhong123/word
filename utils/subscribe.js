// 微信订阅消息模板配置
// =====================================================================
// 模板 ID 来自「微信公众平台 → 功能 → 订阅消息 → 我的模板」，
// 与小程序 AppID 绑定，换账号需重新申请。
// 一次 requestSubscribeMessage 最多传 3 个模板 ID，微信前端查不到剩余次数。
//
// 两种订阅模式（mode）：
//  - 'accumulate' 累计型：每日循环类提醒（如打卡），需用户提前多次订阅囤额度，
//    详情页显示「已累计次数 + 再订阅一次」按钮，countKey 记本地累计次数；
//    prefKey 控制提醒开关，关闭不清空累计次数。
//  - 'event' 事件型：在某个动作发生时才需要提醒（如学完出报告、练习出分、支付成功），
//    应在事件发生那一刻就地拉起订阅（见 requestSubscribeForEvent），
//    详情页只做「开/关」偏好（默认开），prefKey 记偏好；不需要累计按钮。
// =====================================================================

const mockStore = require('./mock/mock-store')

// 打卡提醒（在线教育·打卡提醒，模板编号 504）
const CHECKIN_REMIND_TMPL_ID = 'wIiz5RXzkJYLp0pw63mEUpYqS2zSRSet1P_afBV58k0'
const CHECKIN_REMIND_TIME = '08:30'

// ⚠️ event 型模板的 title / desc / when 请按公众平台后台实际模板核对调整。
const SUBSCRIBE_TEMPLATES = [
  {
    id: CHECKIN_REMIND_TMPL_ID,
    title: '打卡提醒',
    desc: '到打卡时间提醒你，避免断签',
    when: '每天 8:30 提醒完成今日学习',
    mode: 'accumulate',
    prefKey: 'subscribePref_checkin',
    countKey: 'checkinRemindCount', // 与打卡日历页共用同一计数
    previewFields: [
      { label: '计划名', value: '每日8:30学习提醒' },
      { label: '任务说明', value: '完成今日学习，保持连续打卡' },
      { label: '进度', value: '0/21' },
      { label: '打卡时间', value: '08:30:00' },
      { label: '已打卡次数', value: '3' }
    ]
  },
  {
    id: 'RpsH9zwTbY6f4zV6WhmuPZ096nfwJj95guxKOwy03nE',
    title: '支付成功通知',
    desc: '全部课本已解锁，开始学习吧',
    when: '支付成功后自动提醒',
    mode: 'event',
    prefKey: 'subscribePref_payment',
    previewFields: [
      { key: 'thing1', label: '商品名称', value: '1年会员' },
      { key: 'amount2', label: '支付金额', value: '109.00元' },
      { key: 'time3', label: '支付时间', value: '2026-06-30 21:08' },
      { key: 'thing4', label: '温馨提示', value: '课本解锁至2027-06-30，开始学习' }
    ]
  },
  {
    id: 'Bq5QCQ0Km8XTBapXuDavgzC0YrjUupVxJ_Hob0hmch4',
    title: '学习报告通知',
    desc: '环节、入门测、结业测完成后提醒查看报告',
    when: '每个环节学完 / 入门测、结业测完成后自动提醒',
    mode: 'event',
    prefKey: 'subscribePref_report',
    previewFields: [
      { key: 'thing1', label: '报告类型', value: '关卡学习报告' },
      { key: 'thing2', label: '英语学习时长', value: '约5分钟' },
      { key: 'number3', label: '学习得分', value: '96' },
      { key: 'thing4', label: '备注', value: '本关报告已生成，复盘再闯关' }
    ]
  }
]

// 过滤掉空串和占位项，未配置真实 ID 时不展示。
function isUsableTmplId(id) {
  return !!id && !/^PLACEHOLDER|^REPLACE_WITH/.test(id)
}

function getSubscribeTemplates() {
  return SUBSCRIBE_TEMPLATES.filter(item => isUsableTmplId(item.id))
}

function getSubscribeTmplIds() {
  return getSubscribeTemplates().map(item => item.id)
}

function getCheckinRemindTmplId() {
  return isUsableTmplId(CHECKIN_REMIND_TMPL_ID) ? CHECKIN_REMIND_TMPL_ID : ''
}

function findTemplate(idOrPrefKey) {
  return SUBSCRIBE_TEMPLATES.find(item => item.id === idOrPrefKey || item.prefKey === idOrPrefKey)
}

// 事件型偏好，默认开启（未设置过即视为开）。
// 订阅偏好是后端业务态（建议 user/info.subscribePrefs 下发），前端不持久化到裸 Storage：
// 收口到 mock-store 的 subscribePrefs slice。
function getSubscribePref(prefKey) {
  const prefs = mockStore.getSlice('subscribePrefs') || {}
  const value = prefs[prefKey]
  if (value === '' || value === undefined || value === null) {
    return true
  }
  return !!value
}

function setSubscribePref(prefKey, enabled) {
  const prefs = Object.assign({}, mockStore.getSlice('subscribePrefs'))
  prefs[prefKey] = enabled ? 1 : 0
  // 接后端：随 user/info-update 提交 subscribePrefs
  mockStore.setSlice('subscribePrefs', prefs)
}

// 订阅提醒累计次数（一次性订阅囤额度，供后端累计/扣减）。
// 业务态 → mock-store 的 subscribeQuota slice，按 countKey 分键。
function getSubscribeQuota(countKey) {
  if (!countKey) {
    return 0
  }
  const quota = mockStore.getSlice('subscribeQuota') || {}
  return Number(quota[countKey]) || 0
}

function bumpSubscribeQuota(countKey, delta) {
  if (!countKey) {
    return 0
  }
  const quota = Object.assign({}, mockStore.getSlice('subscribeQuota'))
  quota[countKey] = (Number(quota[countKey]) || 0) + (Number(delta) || 0)
  mockStore.setSlice('subscribeQuota', quota)
  return quota[countKey]
}

function formatAmount(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return '0.00元'
  }
  return amount.toFixed(2) + '元'
}

function formatMessageText(value, fallback, maxLength) {
  const text = String(value == null || value === '' ? fallback : value)
  return text.length > maxLength ? text.slice(0, maxLength) : text
}

function encodeQueryValue(value) {
  return encodeURIComponent(String(value == null ? '' : value))
}

function buildUnitReportPage(options) {
  options = options || {}
  return '/pages/report/report?' + [
    'resBookId=' + encodeQueryValue(options.resBookId),
    'unitId=' + encodeQueryValue(options.unitId),
    'sort=' + encodeQueryValue(options.sort || 1),
    'words=' + encodeQueryValue(options.words || 12),
    'en=' + encodeQueryValue(options.en || ''),
    'zh=' + encodeQueryValue(options.zh || '')
  ].join('&')
}

function buildExamReportPage(options) {
  options = options || {}
  return '/pages/exam/exam-report?' + [
    'resBookId=' + encodeQueryValue(options.resBookId),
    'type=' + encodeQueryValue(options.type === 'exit' ? 'exit' : 'entry'),
    'name=' + encodeQueryValue(options.name || '')
  ].join('&')
}

function buildPaymentSuccessMessageData(order) {
  order = order || {}
  const expireHint = order.expireText ? '课本解锁至' + order.expireText + '，开始学习' : '全部课本已解锁，开始学习吧'
  return {
    thing1: { value: formatMessageText(order.tierName || order.productName, '会员套餐', 20) },
    amount2: { value: formatAmount(order.price) },
    time3: { value: formatMessageText(order.createdAt || order.payTime, '', 20) },
    thing4: { value: formatMessageText(order.remark, expireHint, 20) }
  }
}

function buildReportMessageData(report) {
  report = report || {}
  return {
    thing1: { value: formatMessageText(report.reportType, '学习报告', 20) },
    thing2: { value: formatMessageText(report.durationText, '约5分钟', 20) },
    number3: { value: String(Math.round(Number(report.score) || 0)) },
    thing4: { value: formatMessageText(report.remark, '点击查看报告详情', 20) }
  }
}

// 在「报告生成 / 练习出分 / 支付成功」等事件发生时调用：
// 若用户开启了该类提醒，就地拉起订阅授权（一次性订阅，正好为这次事件囤一次额度）。
// 用法示例（报告页生成报告后）：
//   const { requestSubscribeForEvent } = require('../../utils/subscribe')
//   requestSubscribeForEvent('Bq5QCQ0Km8XTBapXuDavgzC0YrjUupVxJ_Hob0hmch4')
function requestSubscribeForEvent(idOrPrefKey, options) {
  return new Promise(resolve => {
    options = options || {}
    const tmpl = findTemplate(idOrPrefKey)
    if (!tmpl || !isUsableTmplId(tmpl.id)) {
      resolve(false)
      return
    }
    if (tmpl.prefKey && !getSubscribePref(tmpl.prefKey)) {
      resolve(false)
      return
    }
    if (typeof wx.requestSubscribeMessage !== 'function') {
      resolve(false)
      return
    }
    wx.requestSubscribeMessage({
      tmplIds: [tmpl.id],
      success: res => {
        const accepted = res[tmpl.id] === 'accept'
        if (accepted) {
          // 预留后端：上报本次事件订阅（懒加载 api 避免循环依赖）
          try {
            require('./api').reportSubscribeMessageQuota(Object.assign({
              tmplId: tmpl.id,
              delta: 1,
              source: 'event'
            }, options.reportPayload || {}, {
              messageData: options.messageData || null
            }))
          } catch (e) {}
        }
        resolve(accepted)
      },
      fail: () => resolve(false)
    })
  })
}

module.exports = {
  CHECKIN_REMIND_TMPL_ID,
  CHECKIN_REMIND_TIME,
  SUBSCRIBE_TEMPLATES,
  getSubscribeTemplates,
  getSubscribeTmplIds,
  getCheckinRemindTmplId,
  getSubscribePref,
  setSubscribePref,
  getSubscribeQuota,
  bumpSubscribeQuota,
  buildUnitReportPage,
  buildExamReportPage,
  buildPaymentSuccessMessageData,
  buildReportMessageData,
  requestSubscribeForEvent
}
