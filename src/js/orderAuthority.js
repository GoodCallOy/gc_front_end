/**
 * Assign Goals is the authority for a campaign in a given month.
 * Other screens must read through these helpers so charts, edit case,
 * agent dashboards, and Assign Goals stay in sync.
 *
 * Stored fields (order document) are implementation details:
 * monthlyGoal / totalQuantity, agentGoals, agentRates / agentPrices,
 * agentAssignments, assignedCallers, campaignGoal, monthlyOrderStatus.
 */

export {
  assignedCallerId,
  assignedCallerIds,
  getStoredAgentGoal,
  getStoredAgentRate,
  getDistributedAssignedGoals,
  getOrderMonthGoalUnits,
  getScaledAgentGoalForMonth,
  getAssignableGoalCap,
  recordToObject,
} from '@/js/statsUtils.js'

import {
  assignedCallerIds,
  getStoredAgentGoal,
  getStoredAgentRate,
  getOrderMonthGoalUnits,
} from '@/js/statsUtils.js'

export function isAgentAssignedToOrder(order, agentId) {
  const aid = String(agentId ?? '')
  if (!aid) return false
  return assignedCallerIds(order).includes(aid)
}

/** Campaign-lifetime unit goal (Assign Goals campaign column). */
export function getCampaignGoalUnits(order, cases = []) {
  const fromOrder = order?.campaignGoal ?? order?.campaign_goal
  if (fromOrder != null && fromOrder !== '') {
    const n = Number(fromOrder)
    if (n > 0) return n
  }
  const caseId = order?.caseId?._id ?? order?.caseId?.id ?? order?.caseId
  if (caseId && Array.isArray(cases) && cases.length) {
    const c = cases.find((x) => String(x._id ?? x.id) === String(caseId))
    const fromCase = c?.campaignGoal ?? c?.campaign_goal
    if (fromCase != null && fromCase !== '') {
      const n = Number(fromCase)
      if (n > 0) return n
    }
  }
  return getOrderMonthGoalUnits(order)
}

/** Snapshot Assign Goals uses when editing one campaign. */
export function getOrderAssignmentSnapshot(order) {
  const ids = assignedCallerIds(order)
  return ids.map((id) => ({
    id,
    goal: getStoredAgentGoal(order, id),
    rate: getStoredAgentRate(order, id),
  }))
}

/**
 * Write shape Assign Goals saves: agentGoals / agentRates / agentPrices / agentAssignments
 * for the callers actually on the order.
 */
export function buildAssignmentWriteFields(rows = []) {
  const list = (rows || [])
    .map((r) => ({
      id: String(r?.id ?? r?._id ?? ''),
      name: r?.name || '',
      goal: Number(r?.goal ?? r?.goalForThisOrder) || 0,
      rate: Number(r?.rate ?? r?.rateForThisOrder) || 0,
    }))
    .filter((r) => r.id)
  return {
    agentGoals: Object.fromEntries(list.map((r) => [r.id, r.goal])),
    agentRates: Object.fromEntries(list.map((r) => [r.id, r.rate])),
    agentPrices: Object.fromEntries(list.map((r) => [r.id, r.rate])),
    agentAssignments: list,
  }
}
