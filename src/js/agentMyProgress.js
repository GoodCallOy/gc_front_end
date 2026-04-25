import { roundTo2Decimals } from '@/js/formatNumbers';

function isTestCase(order) {
  if (!order) return false;
  const caseType = String(order.caseType || '').toLowerCase();
  if (caseType.includes('test')) return true;
  const caseName = String(order.caseName || '').toLowerCase();
  if (caseName.includes('test')) return true;
  if (order.isTest === true || order.test === true) return true;
  return false;
}

function isAgentAssignedToOrder(order, agentId) {
  if (!order?.assignedCallers || !Array.isArray(order.assignedCallers)) return false;
  const aid = String(agentId);
  return order.assignedCallers.some((caller) => {
    const callerId = caller?._id ?? caller?.id ?? caller;
    return String(callerId) === aid;
  });
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
 * @param {object} agent
 * @param {object[]} orders
 * @param {object[]} statsLogs daily logs (store `dailyLogs` or merged stats)
 * @param {string[]|null|undefined} dateRange [start, end] ISO
 * @param {object[]} [gcAgents]
 * @returns {number|null} average percent, or null if no applicable orders
 */
export function computeAgentMyProgressPercent(agent, orders, statsLogs, dateRange, gcAgents = []) {
  const agentId = resolveGcAgentId(agent, gcAgents);
  if (!agentId || !Array.isArray(orders) || !Array.isArray(statsLogs)) return null;

  let from;
  let to;
  if (dateRange && dateRange.length >= 2) {
    from = new Date(dateRange[0]);
    to = new Date(dateRange[1]);
    to.setHours(23, 59, 59, 999);
  }

  const userOrders = (orders || []).filter(
    (o) =>
      isAgentAssignedToOrder(o, agentId) &&
      Number(o?.agentGoals?.[agentId] ?? 0) > 0 &&
      !isTestCase(o)
  );

  if (!userOrders.length) return null;

  const inRange = userOrders.filter((order) => {
    if (!from || !to) return true;
    const orderStart = new Date(order.startDate || 0);
    const orderEnd = new Date(order.deadline || 0);
    return orderStart <= to && orderEnd >= from;
  });

  if (!inRange.length) return null;

  const stats = statsLogs;
  const percentages = inRange.map((order) => {
    const orderId = String(order._id ?? order.id ?? '');
    const myGoal = Number(order?.agentGoals?.[agentId] ?? 0);

    const myAgentOrderLogsRaw = stats.filter((log) => {
      const logOrderId = String(log?.order?._id ?? log?.order ?? log?.orderId ?? '');
      const logCaseName = log?.caseName ?? '';
      const sameOrder = logOrderId === orderId || logCaseName === (order?.caseName ?? '');
      const logAgentId = String(log?.agent?._id ?? log?.agent ?? log?.agentId ?? '');
      if (logAgentId !== agentId || !sameOrder) return false;
      if (from && to) {
        const d = new Date(log?.date);
        return d >= from && d <= to;
      }
      return true;
    });

    const myAgentOrderLogs = [];
    const seenMyLogs = new Set();
    myAgentOrderLogsRaw.forEach((log) => {
      const key = `${log.date}_${log.agentName || log.agent}_${log.caseName}_${log._id || log.id}`;
      if (!seenMyLogs.has(key)) {
        seenMyLogs.add(key);
        myAgentOrderLogs.push(log);
      }
    });

    const myAgentUnits = myAgentOrderLogs.reduce(
      (sum, l) => sum + (Number(l?.quantityCompleted) ?? 0),
      0
    );
    return myGoal > 0 ? Number(((myAgentUnits / myGoal) * 100).toFixed(2)) : 0;
  });

  const sum = percentages.reduce((acc, p) => acc + (Number(p) || 0), 0);
  return roundTo2Decimals(sum / percentages.length);
}
