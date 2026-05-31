/**
 * Build payloads / form prefill when copying an order to the next calendar month.
 * Keeps assign-goals bulk copy and modal copy aligned with OrderForm submit fields.
 */

import { orderSpansMultipleMonths } from '@/js/statsUtils';
import { roundTo2Decimals } from '@/js/formatNumbers';

function monthKeyFromDate(dateVal) {
  const s = String(dateVal || '').split('T')[0];
  return s.length >= 7 ? s.slice(0, 7) : '';
}

export function toDateOnly(dateValue) {
  if (!dateValue) return null;
  const str = String(dateValue);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (str.includes('T')) return str.split('T')[0];
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Full campaign unit goal from order (not “remaining”). */
export function getCampaignGoalFromOrder(order) {
  const fromOrder = order?.campaignGoal ?? order?.campaign_goal;
  if (fromOrder != null && fromOrder !== '') {
    const n = Number(fromOrder);
    if (n > 0) return n;
  }
  return Number(order?.monthlyGoal ?? order?.totalQuantity) || 0;
}

/**
 * Goals and dates for a next-month copy.
 * Multi-month: keep original campaign start/deadline + full campaign goal; monthly = units left.
 * Single-month: one calendar month slice; monthly and campaign = remaining.
 */
export function resolveOrderCopyFields(order, nextStart, nextEnd, getRemainingCampaignGoal) {
  const isMultiMonth = orderSpansMultipleMonths(order);
  const campaignGoal = roundTo2Decimals(getCampaignGoalFromOrder(order));
  const remaining = roundTo2Decimals(
    typeof getRemainingCampaignGoal === 'function'
      ? getRemainingCampaignGoal(order, nextStart)
      : campaignGoal
  );

  if (isMultiMonth) {
    return {
      isMultiMonth: true,
      startDate: toDateOnly(order.startDate) || nextStart,
      deadline: toDateOnly(order.deadline) || nextEnd,
      monthlyGoal: remaining,
      campaignGoal,
    };
  }

  return {
    isMultiMonth: false,
    startDate: nextStart,
    deadline: nextEnd,
    monthlyGoal: remaining,
    campaignGoal: remaining,
  };
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
export function buildOrderCopyPayload(order, copyFields, extra = {}) {
  const {
    monthlyGoal,
    campaignGoal,
    startDate,
    deadline,
  } = copyFields;
  const { agents = [], sourceMonthStart } = extra;
  const price = Number(order?.pricePerUnit) || 0;
  const monthly = Number(monthlyGoal) || 0;
  const campaign = Number(campaignGoal) ?? monthly;
  const assignedIds = normalizeAssignedCallerIds(order);
  const managerIds = normalizeManagerIds(order);
  const { agentGoals, agentRates, agentPrices } = copyAgentMaps(order);

  return {
    caseId: order?.caseId || null,
    caseName: order?.caseName || '',
    caseUnit: order?.caseUnit || null,
    pricePerUnit: price,
    monthlyGoal: monthly,
    campaignGoal: campaign,
    startDate,
    deadline,
    orderStatus: order?.orderStatus || 'pending',
    caseType: order?.caseType || null,
    enableSearchedPhoneNumbers: !!order?.enableSearchedPhoneNumbers,
    ProjectStartFee: Number(order?.ProjectStartFee ?? order?.projectStartFee ?? 0),
    ProjectManagmentFee: Number(order?.ProjectManagmentFee ?? order?.projectManagementFee ?? 0),
    estimatedRevenue: price * monthly,
    monthlyRevenueGoals: buildMonthlyRevenueGoalsForNextMonth(
      order,
      extra.targetMonthStart ?? startDate,
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
export function buildOrderCopyPrefill(order, copyFields, extra = {}) {
  const {
    monthlyGoal,
    campaignGoal,
    startDate,
    deadline,
  } = copyFields;
  const { sourceMonthStart } = extra;
  const assignedIds = normalizeAssignedCallerIds(order);
  const { agentGoals, agentRates } = copyAgentMaps(order);
  const agentGoalsPrefill = {};
  const agentRatesPrefill = {};
  assignedIds.forEach((id) => {
    agentGoalsPrefill[id] = Number(agentGoals[id]) || 0;
    agentRatesPrefill[id] = Number(agentRates[id]) || 0;
  });

  const price = Number(order?.pricePerUnit) || 0;
  const monthly = Number(monthlyGoal) || 0;
  const campaign = Number(campaignGoal) ?? monthly;

  return {
    caseId: order?.caseId || null,
    caseUnit: order?.caseUnit || null,
    pricePerUnit: price,
    totalQuantity: monthly,
    campaignGoal: campaign,
    startDate,
    deadline,
    orderStatus: order?.orderStatus || 'pending',
    caseType: order?.caseType || null,
    enableSearchedPhoneNumbers: !!order?.enableSearchedPhoneNumbers,
    estimatedRevenue: (price * monthly).toFixed(2),
    ProjectStartFee: order?.ProjectStartFee ?? order?.projectStartFee ?? '',
    ProjectManagmentFee: order?.ProjectManagmentFee ?? order?.projectManagementFee ?? '',
    monthlyRevenueGoals: buildMonthlyRevenueGoalsForNextMonth(
      order,
      extra.targetMonthStart ?? startDate,
      sourceMonthStart ?? order?.startDate
    ),
    managers: normalizeManagerIds(order),
    assignedCallers: assignedIds,
    agentGoals: agentGoalsPrefill,
    agentRates: agentRatesPrefill,
  };
}
