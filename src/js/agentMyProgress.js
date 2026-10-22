import { roundTo2Decimals } from '@/js/formatNumbers';
import { isOrderEligibleForAgentGoalsForMonth, monthKeyFromDateRange } from '@/js/orderStatusUtils';
import { getCampaignMonthView, isAgentAssignedToOrder, getStoredAgentGoal } from '@/js/orderAuthority.js';

function isTestCase(order) {
  if (!order) return false;
  const caseType = String(order.caseType || '').toLowerCase();
  if (caseType.includes('test')) return true;
  const caseName = String(order.caseName || '').toLowerCase();
  if (caseName.includes('test')) return true;
  if (order.isTest === true || order.test === true) return true;
  return false;
}

/**
 * Resolve GC agent id from an agent-like object (legacy row may only have name).
 */
export function resolveGcAgentId(agent, gcAgents = []) {
  let id = String(agent?._id ?? agent?.id ?? '');
  if (id) return id;
  const name = agent?.name;
  if (!name || !Array.isArray(gcAgents)) return '';
  const g = gcAgents.find((a) => (a.name || a.username) === name);
  return String(g?._id ?? g?.id ?? '');
}

/**
 * Average of per-order % toward the agent's monthly unit goal — same definition as
 * agent dashboard `myRevenueToGoalPercent` (mean of row `percentage` values).
 *
 * Uses getCampaignMonthView so % matches the cases table.
 */
export function computeAgentMyProgressPercent(agent, orders, statsLogs, dateRange, gcAgents = []) {
  const agentId = resolveGcAgentId(agent, gcAgents);
  if (!agentId || !Array.isArray(orders) || !Array.isArray(statsLogs)) return null;

  const userOrders = (orders || []).filter(
    (o) =>
      isAgentAssignedToOrder(o, agentId) &&
      getStoredAgentGoal(o, agentId) > 0 &&
      !isTestCase(o)
  );

  if (!userOrders.length) return null;

  const monthKey = monthKeyFromDateRange(dateRange);
  const inRange = userOrders.filter((order) => {
    if (!monthKey) return true;
    return isOrderEligibleForAgentGoalsForMonth(order, monthKey, orders);
  });

  if (!inRange.length) return null;

  const percentages = inRange.map((order) => {
    const view = getCampaignMonthView(order, statsLogs, monthKey, agentId);
    return Number(view.percentage) || 0;
  });

  const sum = percentages.reduce((acc, p) => acc + (Number(p) || 0), 0);
  return roundTo2Decimals(sum / percentages.length);
}
