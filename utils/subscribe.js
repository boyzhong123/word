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

// 打卡提醒（在线教育·打卡提醒，模板编号 504）
const CHECKIN_REMIND_TMPL_ID = 'wIiz5RXzkJYLp0pw63mEUpYqS2zSRSet1P_afBV58k0'

// ⚠️ event 型模板的 title / desc / when 请按公众平台后台实际模板核对调整。
const SUBSCRIBE_TEMPLATES = [
  {
    id: CHECKIN_REMIND_TMPL_ID,
    title: '打卡提醒',
    desc: '到打卡时间提醒你，避免断签',
    when: '每天到打卡时间提醒，需提前订阅累计次数',
    mode: 'accumulate',
    prefKey: 'subscribePref_checkin',
    countKey: 'checkinRemindCount', // 与打卡日历页共用同一计数
    previewFields: [
      { label: '计划名', value: '每日7:00准时晨读' },
      { label: '任务说明', value: '让晨读来开启自己元气满满的一天' },
      { label: '进度', value: '0/21' },
      { label: '打卡时间', value: '06:00:00~08:30:00' },
      { label: '已打卡次数', value: '3' }
    ]
  },
  {
    id: 'RpsH9zwTbY6f4zV6WhmuPZ096nfwJj95guxKOwy03nE',
    title: '支付成功通知',
    desc: '购买成功后提醒查看订单与学习权益',
    when: '支付成功后自动提醒',
    mode: 'event',
    prefKey: 'subscribePref_payment',
    previewFields: [
      { label: '商品名称', value: 'ABCmouse听说读写全能套餐' },
      { label: '支付金额', value: '999.00元' },
      { label: '支付时间', value: '2019-11-11 14:20' },
      { label: '温馨提示', value: '订单已提交，点击下方查看您的学习权益' }
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
      { label: '报告类型', value: '任务报告，学习报告' },
      { label: '英语学习时长', value: '5分钟' },
      { label: '学习得分', value: '100' },
      { label: '备注', value: '本节课的学习报告已生成，快来查看吧' }
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

// 事件型偏好，默认开启（未设置过即视为开）
function getSubscribePref(prefKey) {
  const value = wx.getStorageSync(prefKey)
  if (value === '' || value === undefined || value === null) {
    return true
  }
  return !!value
}

function setSubscribePref(prefKey, enabled) {
  wx.setStorageSync(prefKey, enabled ? 1 : 0)
}

// 在「报告生成 / 练习出分 / 支付成功」等事件发生时调用：
// 若用户开启了该类提醒，就地拉起订阅授权（一次性订阅，正好为这次事件囤一次额度）。
// 用法示例（报告页生成报告后）：
//   const { requestSubscribeForEvent } = require('../../utils/subscribe')
//   requestSubscribeForEvent('Bq5QCQ0Km8XTBapXuDavgzC0YrjUupVxJ_Hob0hmch4')
function requestSubscribeForEvent(idOrPrefKey) {
  return new Promise(resolve => {
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
            require('./api').reportSubscribeMessageQuota({ tmplId: tmpl.id, delta: 1, source: 'event' })
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
  SUBSCRIBE_TEMPLATES,
  getSubscribeTemplates,
  getSubscribeTmplIds,
  getCheckinRemindTmplId,
  getSubscribePref,
  setSubscribePref,
  requestSubscribeForEvent
}
