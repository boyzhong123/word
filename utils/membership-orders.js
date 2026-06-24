const STORAGE_KEY = 'membership_orders'

function readOrders() {
  const value = wx.getStorageSync(STORAGE_KEY)
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
  wx.setStorageSync(STORAGE_KEY, orders)
  return orders
}

module.exports = {
  MEMBERSHIP_ORDER_STORAGE_KEY: STORAGE_KEY,
  readOrders,
  getOrder,
  createOrder,
  saveOrder
}
