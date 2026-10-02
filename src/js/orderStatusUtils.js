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

const STICKY_CLOSED_STATUSES = new Set(['completed', 'cancelled'])

/**
 * True when the campaign was completed or cancelled in an earlier month and this
 * month has no explicit status of its own.
 * On-hold / pending are per-month only — taking a campaign off hold must not
 * keep hiding it in later months.
 */
export function wasOrderInactiveBeforeMonth(order, monthKey) {
  if (!order || !monthKey) return false
  const monthly = getMonthlyOrderStatusMap(order)
  const thisMonth = monthly[monthKey]
  if (thisMonth != null && thisMonth !== '') return false
  return Object.entries(monthly).some(([key, status]) => {
    if (!(key < monthKey)) return false
    return STICKY_CLOSED_STATUSES.has(normalizeOrderStatus(status))
  })
}

export function wasOrderCompletedBeforeMonth(order, monthKey) {
  return wasOrderInactiveBeforeMonth(order, monthKey) &&
    Object.entries(getMonthlyOrderStatusMap(order)).some(
      ([key, status]) => key < monthKey && normalizeOrderStatus(status) === 'completed'
    )
}

function campaignIdentityKey(order) {
  const c = order?.caseId
  const caseId = c && typeof c === 'object' ? String(c._id ?? c.id ?? '') : String(c || '')
  return `${caseId}|${String(order?.caseUnit || '')}|${Number(order?.pricePerUnit || 0)}`
}

function monthHasStickyClosedStatus(order, monthKey) {
  return Object.entries(getMonthlyOrderStatusMap(order)).some(
    ([key, status]) => key < monthKey && STICKY_CLOSED_STATUSES.has(normalizeOrderStatus(status))
  )
}

/**
 * Hide in this month when the campaign was completed/cancelled earlier:
 * the same order with no later status, or a bulk-copied later row of the same campaign.
 * An explicit in-progress/pending/on-hold for this month still shows (reopen).
 */
export function isCampaignClosedBeforeMonth(order, monthKey, allOrders = []) {
  if (!order || !monthKey) return false
  if (wasOrderInactiveBeforeMonth(order, monthKey)) return true

  const identity = campaignIdentityKey(order)
  const siblingClosedEarlier = Boolean(identity && !identity.startsWith('|') && (allOrders || []).some((other) => {
    if (!other || String(other._id ?? other.id) === String(order._id ?? order.id)) return false
    if (campaignIdentityKey(other) !== identity) return false
    return monthHasStickyClosedStatus(other, monthKey)
  }))
  if (siblingClosedEarlier) return true

  const thisMonth = getMonthlyOrderStatusMap(order)[monthKey]
  if (thisMonth != null && thisMonth !== '') return false
  return monthHasStickyClosedStatus(order, monthKey)
}

/** Orders that contribute agent goal/revenue on the agents page for a month. */
export function isOrderEligibleForAgentGoalsForMonth(order, monthKey, allOrders = []) {
  if (isCampaignClosedBeforeMonth(order, monthKey, allOrders)) return false
  const status = getOrderStatusForMonth(order, monthKey)
  return status === 'in-progress' || status === 'completed'
}

/**
 * Cases the agent/admin should see on the agent dashboard for this month.
 * In-progress, pending, and completed for the viewed month.
 * On-hold this month stays hidden. Completed/cancelled from an earlier month stay hidden.
 */
export function isOrderListedOnAgentDashboardForMonth(order, monthKey, allOrders = []) {
  if (isCampaignClosedBeforeMonth(order, monthKey, allOrders)) return false
  const status = getOrderStatusForMonth(order, monthKey)
  return status === 'in-progress' || status === 'pending' || status === 'completed'
}

/**
 * Agent dashboard / personal and team results: work that counts in the viewed month.
 */
export function isOrderActiveForAgentDashboardForMonth(order, monthKey, allOrders = []) {
  if (isCampaignClosedBeforeMonth(order, monthKey, allOrders)) return false
  const status = getOrderStatusForMonth(order, monthKey)
  return status === 'in-progress' || status === 'completed'
}

/** Callers see assigned orders except pending, cancelled, and campaigns already inactive in an earlier month. */
export function isOrderVisibleToCallerForMonth(order, monthKey, allOrders = []) {
  if (isCampaignClosedBeforeMonth(order, monthKey, allOrders)) return false
  return !isOrderPendingForMonth(order, monthKey) && !isOrderCancelledForMonth(order, monthKey)
}

/**
 * Completed campaigns stay open for late daily-log results in any month.
 * Only cancelled orders freeze new or edited logs for that month.
 */
export function areDailyLogsFrozenForOrderMonth(order, monthKey) {
  return isOrderCancelledForMonth(order, monthKey)
}

/** True when this campaign is completed for the log month, or was completed earlier. */
export function isOrderCompletedForDailyLogs(order, monthKey) {
  if (!order || !monthKey) return false
  return isOrderCompletedForMonth(order, monthKey) || wasOrderCompletedBeforeMonth(order, monthKey)
}

/**
 * Campaigns that can receive daily logs: in-progress, pending, and completed
 * (including after the campaign closed or its dates ended). Cancelled stays out.
 */
export function isOrderEligibleForDailyLogsForMonth(order, monthKey, allOrders = []) {
  if (!order) return false
  if (monthKey && isOrderCancelledForMonth(order, monthKey)) return false
  if (monthKey && isOrderCompletedForDailyLogs(order, monthKey)) return true
  if (monthKey && isCampaignClosedBeforeMonth(order, monthKey, allOrders)) return false
  if (!monthKey) return true
  const status = getOrderStatusForMonth(order, monthKey)
  return status === 'in-progress' || status === 'pending'
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
    statuses[tgtKey] = 'in-progress'
  }
  return statuses
}
