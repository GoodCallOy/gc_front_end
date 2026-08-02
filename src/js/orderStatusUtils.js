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
