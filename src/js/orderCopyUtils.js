/**
 * Build payloads / form prefill when copying an order to the next calendar month.
 * Keeps assign-goals bulk copy and modal copy aligned with OrderForm submit fields.
 */

function monthKeyFromDate(dateVal) {
  const s = String(dateVal || '').split('T')[0];
  return s.length >= 7 ? s.slice(0, 7) : '';
}

export function normalizeAssignedCallerIds(order) {
  return [
    ...new Set(
      (order?.assignedCallers || []).map((x) => String(x?._id ?? x?.id ?? x)).filter(Boolean)
    ),
  ];
}

export function normalizeManagerIds(order) {
  if (Array.isArray(order?.managers) && order.managers.length) {
    return order.managers.map((m) => String(m?.id ?? m?._id ?? m)).filter(Boolean);
  }
  if (order?.manager) {
    const id = order.manager._id ?? order.manager.id ?? order.manager;
    return id ? [String(id)] : [];
  }
  return [];
}

export function copyAgentMaps(order) {
  const agentGoals = { ...(order?.agentGoals || {}) };
  const rates = order?.agentRates || order?.agentPrices || {};
  const agentRates = { ...rates };
  const agentPrices = { ...(order?.agentPrices || order?.agentRates || {}) };
  return { agentGoals, agentRates, agentPrices };
}

/** Map prior month's € revenue goal to the target month key when copying. */
export function buildMonthlyRevenueGoalsForNextMonth(order, nextStart, sourceMonthStart) {
  const goals = { ...(order?.monthlyRevenueGoals || {}) };
  const tgtKey = monthKeyFromDate(nextStart);
  const srcKey = monthKeyFromDate(sourceMonthStart || order?.startDate);
  if (tgtKey && srcKey && goals[srcKey] != null) {
    goals[tgtKey] = Number(goals[srcKey]) || 0;
  }
  return goals;
}

function resolveAgentName(agents, id) {
  const agent = (agents || []).find((a) => String(a?._id ?? a?.id) === String(id));
  return agent?.name || '';
}

/**
 * POST /orders/ payload (matches OrderForm.submitForm shape).
 */
export function buildOrderCopyPayload(order, nextStart, nextEnd, options = {}) {
  const { remainingGoal, agents = [], sourceMonthStart } = options;
  const price = Number(order?.pricePerUnit) || 0;
  const monthlyGoal = Number(remainingGoal) || 0;
  const assignedIds = normalizeAssignedCallerIds(order);
  const managerIds = normalizeManagerIds(order);
  const { agentGoals, agentRates, agentPrices } = copyAgentMaps(order);

  return {
    caseId: order?.caseId || null,
    caseName: order?.caseName || '',
    caseUnit: order?.caseUnit || null,
    pricePerUnit: price,
    monthlyGoal,
    campaignGoal: monthlyGoal,
    startDate: nextStart,
    deadline: nextEnd,
    orderStatus: order?.orderStatus || 'pending',
    caseType: order?.caseType || null,
    enableSearchedPhoneNumbers: !!order?.enableSearchedPhoneNumbers,
    ProjectStartFee: Number(order?.ProjectStartFee ?? order?.projectStartFee ?? 0),
    ProjectManagmentFee: Number(order?.ProjectManagmentFee ?? order?.projectManagementFee ?? 0),
    estimatedRevenue: price * monthlyGoal,
    monthlyRevenueGoals: buildMonthlyRevenueGoalsForNextMonth(
      order,
      nextStart,
      sourceMonthStart ?? order?.startDate
    ),
    agentGoals,
    agentRates,
    agentPrices,
    assignedCallers: assignedIds.map((id) => ({
      id,
      name: resolveAgentName(agents, id),
    })),
    managers: managerIds.map((id) => ({
      id,
      name: resolveAgentName(agents, id),
    })),
  };
}

/** OrderForm modal prefill when copying a single order. */
export function buildOrderCopyPrefill(order, nextStart, nextEnd, options = {}) {
  const { remainingGoal, sourceMonthStart } = options;
  const assignedIds = normalizeAssignedCallerIds(order);
  const { agentGoals, agentRates } = copyAgentMaps(order);
  const agentGoalsPrefill = {};
  const agentRatesPrefill = {};
  assignedIds.forEach((id) => {
    agentGoalsPrefill[id] = Number(agentGoals[id]) || 0;
    agentRatesPrefill[id] = Number(agentRates[id]) || 0;
  });

  const price = Number(order?.pricePerUnit) || 0;
  const qty = Number(remainingGoal) || 0;

  return {
    caseId: order?.caseId || null,
    caseUnit: order?.caseUnit || null,
    pricePerUnit: price,
    totalQuantity: qty,
    campaignGoal: qty,
    startDate: nextStart,
    deadline: nextEnd,
    orderStatus: order?.orderStatus || 'pending',
    caseType: order?.caseType || null,
    enableSearchedPhoneNumbers: !!order?.enableSearchedPhoneNumbers,
    estimatedRevenue: (price * qty).toFixed(2),
    ProjectStartFee: order?.ProjectStartFee ?? order?.projectStartFee ?? '',
    ProjectManagmentFee: order?.ProjectManagmentFee ?? order?.projectManagementFee ?? '',
    monthlyRevenueGoals: buildMonthlyRevenueGoalsForNextMonth(
      order,
      nextStart,
      sourceMonthStart ?? order?.startDate
    ),
    managers: normalizeManagerIds(order),
    assignedCallers: assignedIds,
    agentGoals: agentGoalsPrefill,
    agentRates: agentRatesPrefill,
  };
}
