// 微信订阅消息模板配置
// =====================================================================
// ⚠️ 下面是占位 ID，无法真正发消息（微信会报 errInvalidTemplateId）。
// 替换方法：登录「微信公众平台 → 功能 → 订阅消息 → 我的模板」，
// 申请「复习提醒 / 错题回顾 / 练习结果」相关模板，把得到的模板 ID
// 逐个填到 SUBSCRIBE_TMPL_IDS 数组里，删掉占位项即可立即生效。
// 一次 requestSubscribeMessage 最多传 3 个模板 ID。
// =====================================================================
const SUBSCRIBE_TMPL_IDS = [
  // 'REPLACE_WITH_REVIEW_REMIND_TEMPLATE_ID',   // 复习提醒
  // 'REPLACE_WITH_WRONG_WORD_TEMPLATE_ID',      // 错题回顾
  // 'REPLACE_WITH_PRACTICE_RESULT_TEMPLATE_ID', // 练习结果通知
  'PLACEHOLDER_TMPL_ID_1'
]

function getSubscribeTmplIds() {
  // 过滤掉空串和占位项，保证未配置真实 ID 时返回空数组，
  // 上层会据此提示「暂无可订阅的消息模板」。
  return SUBSCRIBE_TMPL_IDS.filter(id => id && !/^PLACEHOLDER|^REPLACE_WITH/.test(id))
}

module.exports = {
  SUBSCRIBE_TMPL_IDS,
  getSubscribeTmplIds
}
