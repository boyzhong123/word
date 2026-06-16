// 关卡学习报告 · 顶部鼓励语
// 用于 pages/report/report.js；后端联调时可前端计算，或由 unit-report 直接返回 encourage。

/**
 * @param {number} accuracy 总正确率 0–100
 * @param {number} reviewCount 待复习词数
 */
function unitEncourageText(accuracy, reviewCount) {
  const score = Number(accuracy) || 0
  const review = Math.max(0, Number(reviewCount) || 0)
  if (score >= 95) return '近乎满分，太棒啦！'
  if (score >= 85) return '表现很棒，再巩固一下错词就更稳了。'
  if (review > 0) return '把 ' + review + ' 个错词再练一练，正确率还能往上冲。'
  return '稳扎稳打，继续加油！'
}

module.exports = {
  unitEncourageText
}
