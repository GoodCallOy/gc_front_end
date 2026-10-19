/**
 * Campaign / Assign Goals authority — ONE place for month progress math.
 *
 * UI screens (agent dashboard, cards, reports, Assign Goals, agents page)
 * should call `getCampaignMonthView` (or the re-exported helpers below)
 * instead of re-implementing my/team goal leftover logic.
 *
 * Rules (multi-month):
 * - Team goal for a month = campaign leftover at that month's start (0 if already met)
 * - Team units = completed in that calendar month
 * - Personal (my) goal = that agent's unused assignment, carried into the
 *   next month for every case. Never split leftover or auto-assign it.
 * - Personal units = that agent's completed units in that calendar month
 *
 * Stored fields on the order document are implementation details:
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
  getTeamMonthProgress,
  resolveCampaignGoalUnits,
  getCampaignRemainingUnits,
  getCampaignRemainingUnitsAtMonthStart,
  sumOrderUnitsInMonth,
  calculateMonthlyProgress,
  orderSpansMultipleMonths,
  recordToObject,
  getLogCallHours,
  getLogCompletedUnits,
} from '@/js/statsUtils.js'

import {
  assignedCallerIds,
  getStoredAgentGoal,
  getStoredAgentRate,
  getOrderMonthGoalUnits,
  getScaledAgentGoalForMonth,
  getTeamMonthProgress,
  resolveCampaignGoalUnits,
  sumOrderUnitsInMonth,
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
  return resolveCampaignGoalUnits(order) || getOrderMonthGoalUnits(order)
}

/**
 * Single snapshot for one campaign in one viewed month.
 * Optional agentId adds personal myGoal / myUnits / € fields.
 *
 * @param {object} order
 * @param {object[]} dailyLogs  Prefer full case logs (all agents) when available
 * @param {string} monthKey     YYYY-MM
 * @param {string|null} [agentId]
 */
export function getCampaignMonthView(order, dailyLogs = [], monthKey = '', agentId = null) {
  const key = String(monthKey || '').slice(0, 7)
  const team = getTeamMonthProgress(order, dailyLogs || [], key)
  const pricePerUnit = Number(order?.pricePerUnit) || 0
  const campaignGoal = Number(team.campaignGoal) || getCampaignGoalUnits(order)
  const teamGoal = Number(team.teamGoal) || 0
  const teamUnits = Number(team.teamUnits) || 0

  const view = {
    monthKey: key,
    isMultiMonth: Boolean(team.isMultiMonth),
    campaignGoal,
    monthlyGoal: getOrderMonthGoalUnits(order),
    teamGoal,
    teamUnits,
    monthlyBreakdown: team.monthlyBreakdown,
    pricePerUnit,
    teamRevenue: teamUnits * pricePerUnit,
    teamRevenueGoal: teamGoal * pricePerUnit,
  }

  if (agentId != null && agentId !== '') {
    const aid = String(agentId)
    const myGoal = getScaledAgentGoalForMonth(order, aid, dailyLogs || [], key)
    const myUnits = sumOrderUnitsInMonth(order, dailyLogs || [], key, aid)
    const myRate = getStoredAgentRate(order, aid)
    view.agentId = aid
    view.storedGoal = getStoredAgentGoal(order, aid)
    view.myGoal = myGoal
    view.myUnits = myUnits
    view.myAgentUnits = myUnits
    view.myRate = myRate
    view.myRevenueGoal = myGoal * pricePerUnit
    view.currentRevenue = myUnits * pricePerUnit
    view.myPaycheck = myUnits * myRate
    view.percentage = myGoal > 0 ? Number(((myUnits / myGoal) * 100).toFixed(2)) : 0
  }

  return view
}

/** Project start + management fees (€). */
export function getOrderFeeEuros(order) {
  const start = Number(order?.ProjectStartFee ?? order?.projectStartFee ?? 0)
  const management = Number(order?.ProjectManagmentFee ?? order?.projectManagementFee ?? 0)
  return (Number.isFinite(start) ? start : 0) + (Number.isFinite(management) ? management : 0)
}

/** Campaign call-work €: always campaign goal units × price (not inflated by assigned goals). */
export function campaignEstimatedRevenueEuros(order, cases = []) {
  const price = Number(order?.pricePerUnit) || 0
  const campaignUnits = Number(getCampaignGoalUnits(order, cases)) || 0
  return campaignUnits * price
}

/** Campaign estimated revenue plus fees. */
export function campaignTotalRevenueWithFeesEuros(order, cases = []) {
  return campaignEstimatedRevenueEuros(order, cases) + getOrderFeeEuros(order)
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
