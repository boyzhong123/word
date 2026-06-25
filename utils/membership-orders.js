// 会员订单是后端业务真值（GET /mini-app/membership/orders），前端不持久化：
// 收口到 mock-store 的 membershipOrders slice。
const mockStore = require('./mock/mock-store')

function readOrders() {
  const value = mockStore.getSlice('membershipOrders')
  return Array.isArray(value) ? value : []
}

function getOrder(orderId) {
  const id = String(orderId || '')
  return readOrders().find(item => String(item.id) === id) || null
}

function formatDateTime(time) {
  const date = new Date(time)
  const pad = value => String(value).padStart(2, '0')
  return date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + ' ' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes())
}

function createOrder(tier, byRedeem, code, membership) {
  const now = Date.now()
  return {
    id: 'VIP' + String(now).slice(-10),
    tierId: tier.id,
    tierName: tier.name + '会员',
    durationText: tier.name,
    originalPrice: tier.price,
    price: byRedeem ? 0 : tier.price,
    method: byRedeem ? '兑换码' : '微信支付',
    code: byRedeem ? code : '',
    createdAt: formatDateTime(now),
    expireText: membership && membership.expireText ? membership.expireText : ''
  }
}

function saveOrder(order) {
  const orders = [order].concat(readOrders()).slice(0, 20)
  // 接后端：订单由 POST /mini-app/membership/order 创建并返回，这里改为重新拉列表
  mockStore.setSlice('membershipOrders', orders)
  return orders
}

module.exports = {
  readOrders,
  getOrder,
  createOrder,
  saveOrder
}
