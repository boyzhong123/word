// 关卡解锁规则已收口到唯一规则源 utils/mock/level-lock.js（由 mock 会员字段驱动）。
// 本文件保留为兼容入口（旧 import 路径不变），全部委托过去，规则不再有第二处实现。
// 规则：第 1 关（sort===1）始终免费；复习关跟随会员；其余关需会员。随身听同理。
module.exports = require('./mock/level-lock')
