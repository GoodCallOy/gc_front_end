/** Order status helpers — global fallback plus per-month overrides (YYYY-MM keys). */

export const ORDER_STATUS_OPTIONS = [
  'pending',
  'in-progress',
  'completed',
  'cancelled',
  'on-hold',
]

export function normalizeOrderStatus(status) {
  return String(status ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
}

export function monthKeyFromDateRange(dateRange) {
  if (!Array.isArray(dateRange) || !dateRange[0]) return ''
  const s = String(dateRange[0]).split('T')[0]
  return s.length >= 7 ? s.slice(0, 7) : ''
}

export function monthKeyFromDate(dateVal) {
  const s = String(dateVal || '').split('T')[0]
  return s.length >= 7 ? s.slice(0, 7) : ''
}

export function getMonthlyOrderStatusMap(order) {
  return order?.monthlyOrderStatus || order?.monthly_order_status || {}
}

/** Status for a calendar month; falls back to order.orderStatus when no monthly entry exists. */
export function getOrderStatusForMonth(order, monthKey) {
  if (!order) return 'pending'
  const key = String(monthKey || '')
  const monthly = getMonthlyOrderStatusMap(order)
  if (key && monthly[key] != null && monthly[key] !== '') {
    return normalizeOrderStatus(monthly[key])
  }
  return normalizeOrderStatus(order.orderStatus ?? order.status ?? 'pending')
}

export function isOrderOnHoldForMonth(order, monthKey) {
  return getOrderStatusForMonth(order, monthKey) === 'on-hold'
}

export function isOrderInProgressForMonth(order, monthKey) {
  return getOrderStatusForMonth(order, monthKey) === 'in-progress'
}

export function isOrderCompletedForMonth(order, monthKey) {
  return getOrderStatusForMonth(order, monthKey) === 'completed'
}

export function isOrderPendingForMonth(order, monthKey) {
  return getOrderStatusForMonth(order, monthKey) === 'pending'
}

export function isOrderCancelledForMonth(order, monthKey) {
  return getOrderStatusForMonth(order, monthKey) === 'cancelled'
}

/** Orders that contribute agent goal/revenue on the agents page for a month. */
export function isOrderEligibleForAgentGoalsForMonth(order, monthKey) {
  const status = getOrderStatusForMonth(order, monthKey)
  return status === 'in-progress' || status === 'completed'
}

/** Callers see assigned orders except pending and cancelled for the month. */
export function isOrderVisibleToCallerForMonth(order, monthKey) {
  return !isOrderPendingForMonth(order, monthKey) && !isOrderCancelledForMonth(order, monthKey)
}

/** Completed and cancelled orders cannot receive new or edited daily logs for that month. */
export function areDailyLogsFrozenForOrderMonth(order, monthKey) {
  const status = getOrderStatusForMonth(order, monthKey)
  return status === 'completed' || status === 'cancelled'
}

export function findOrderForDailyLog(orders, log) {
  if (!log || !Array.isArray(orders)) return null
  const orderId = String(log.order?._id ?? log.order?.id ?? log.order ?? '')
  if (orderId) {
    const byId = orders.find((o) => String(o._id ?? o.id) === orderId)
    if (byId) return byId
  }
  const caseName = String(log.caseName ?? '').trim()
  if (!caseName) return null
  return orders.find((o) => String(o.caseName ?? '').trim() === caseName) || null
}

export function areDailyLogsFrozenForLog(orders, log) {
  const order = findOrderForDailyLog(orders, log)
  if (!order) return false
  return areDailyLogsFrozenForOrderMonth(order, monthKeyFromDate(log?.date))
}

/** Merge one month into monthlyOrderStatus for PUT /orders/:id */
export function buildMonthlyOrderStatusUpdate(order, monthKey, newStatus) {
  const normalized = normalizeOrderStatus(newStatus)
  const monthlyOrderStatus = {
    ...getMonthlyOrderStatusMap(order),
    [String(monthKey)]: normalized,
  }
  return { monthlyOrderStatus }
}

/** Copy source month status onto target month key when bulk/single copying orders. */
export function buildMonthlyOrderStatusForNextMonth(order, nextStart, sourceMonthStart) {
  const statuses = { ...getMonthlyOrderStatusMap(order) }
  const tgtKey = monthKeyFromDate(nextStart)
  const srcKey = monthKeyFromDate(sourceMonthStart || order?.startDate)
  if (!tgtKey) return statuses
  if (srcKey && statuses[srcKey] != null) {
    statuses[tgtKey] = normalizeOrderStatus(statuses[srcKey])
  } else if (order?.orderStatus) {
    statuses[tgtKey] = normalizeOrderStatus(order.orderStatus)
  } else {
    statuses[tgtKey] = 'pending'
  }
  return statuses
}
