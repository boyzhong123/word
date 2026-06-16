// 测评报告 · 等级徽章 / 模块状态 / 评语文案
// 用于 pages/exam/exam-report.js；后端联调时可前端计算，或由 exam-result 直接返回 grade/encourage。

/** 顶部等级徽章（总正确率） */
function gradeText(accuracy) {
  const score = Number(accuracy) || 0
  if (score >= 90) return '优秀'
  if (score >= 75) return '良好'
  if (score >= 60) return '及格'
  return '待加强'
}

/** 单词/句子模块、题型条 · 状态文案 */
function tierText(accuracy) {
  const score = Number(accuracy) || 0
  if (score >= 80) return '掌握'
  if (score >= 50) return '较好'
  return '待练'
}

/** 题型条 · 进度条颜色 */
function toneColor(accuracy) {
  const score = Number(accuracy) || 0
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

/**
 * 顶部评语（hero-encourage）
 * @param {'entry'|'exit'} type
 * @param {number} accuracy 总正确率 0–100
 * @param {number|null|undefined} delta 结业−入门总正确率差；无入门数据时传 null/undefined
 */
function encourageText(type, accuracy, delta) {
  const score = Number(accuracy) || 0
  const hasCompare = delta !== null && delta !== undefined && Number.isFinite(Number(delta))
  const diff = hasCompare ? Number(delta) : 0

  if (type === 'exit' && hasCompare) {
    if (diff > 0) return '相比入门测进步明显，继续保持！'
    if (diff < 0) return '状态有波动，把错题再巩固一遍就好。'
    // 结业与入门总正确率相同
    if (score >= 85) return '水平保持稳定，挑战更高目标吧！'
    if (score >= 60) return '整体表现平稳，把错题练熟还能再上分。'
    return '基础还需打牢，从错题入手一步步提升。'
  }

  // 入门测，或结业测但无入门对比数据
  if (score >= 85) return '基础很扎实，按计划学习会更稳。'
  if (score >= 60) return '已有不错的基础，正是提升的好时机。'
  return '别担心，这正是开始的地方，一起加油！'
}

module.exports = {
  gradeText,
  tierText,
  toneColor,
  encourageText
}
