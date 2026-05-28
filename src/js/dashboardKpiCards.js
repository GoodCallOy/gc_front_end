import { formatCurrencyEUR, formatStatNumber } from '@/js/formatNumbers';

export const DASHBOARD_CHANNEL_COLORS = [
  '#26a69a',
  '#5d5d5d',
  '#ef5350',
  '#ffc107',
  '#7e57c2',
  '#42a5f5',
  '#8d6e63',
  '#ab47bc',
];

export function buildCaseTypeColorMap(caseTypes) {
  const sorted = [...caseTypes].sort((a, b) => String(a).localeCompare(String(b)));
  const map = new Map();
  sorted.forEach((type, i) => {
    map.set(type, DASHBOARD_CHANNEL_COLORS[i % DASHBOARD_CHANNEL_COLORS.length]);
  });
  return map;
}

export function buildInsightKpi(est, total, t) {
  if (!(est > 0)) {
    return {
      title: t('ordersDashboard.charts.kpiVsPlan'),
      value: '—',
      progress: 0,
      barColor: '#e0e0e0',
      subtitle: t('ordersDashboard.charts.kpiVsPlanNoEstimate'),
    };
  }
  const ahead = total - est;
  if (ahead > 0) {
    return {
      title: t('ordersDashboard.charts.kpiAheadOfPlan'),
      value: formatCurrencyEUR(ahead),
      progress: 100,
      barColor: '#43a047',
      subtitle: t('ordersDashboard.charts.kpiAheadOfPlanHint'),
    };
  }
  const remaining = est - total;
  const remainingPct = Math.round((remaining / est) * 100);
  return {
    title: t('ordersDashboard.charts.kpiRemainingToPlan'),
    value: formatCurrencyEUR(remaining),
    progress: Math.min(100, remainingPct),
    barColor: remaining <= 0 ? '#43a047' : '#fb8c00',
    subtitle:
      remaining <= 0
        ? t('ordersDashboard.charts.kpiPlanMet')
        : `${formatStatNumber(remainingPct)}% ${t('ordersDashboard.charts.ofEstimateRemaining')}`,
  };
}

const PLACEHOLDER_KPI = {
  title: '—',
  value: '—',
  progress: 0,
  barColor: '#e0e0e0',
  subtitle: '',
};

/**
 * Six-card KPI row matching orders dashboard charts (estimated, current, top case types, insight).
 * @param {object} options
 * @param {number} options.estimated
 * @param {number} options.current
 * @param {Map<string, number>} options.revenueByCaseType
 * @param {function} options.t - vue-i18n t()
 * @param {string} [options.estimatedCardSubtitle] - override subtitle on estimated card (e.g. '' for admin)
 */
export function buildRevenueKpiCards({ estimated, current, revenueByCaseType, t, estimatedCardSubtitle }) {
  const est = Number(estimated) || 0;
  const total = Number(current) || 0;
  const pctEst = est > 0 ? Math.min(100, Math.round((total / est) * 100)) : 0;

  const byType = [...(revenueByCaseType || new Map()).entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const top = byType.slice(0, 3);
  const colorMap = buildCaseTypeColorMap([...revenueByCaseType.keys()]);

  const estimatedSubtitle =
    estimatedCardSubtitle !== undefined
      ? estimatedCardSubtitle
      : est > 0
        ? t('ordersDashboard.charts.kpiEstimatedHint')
        : t('ordersDashboard.charts.noEstimate');

  const cards = [
    {
      title: t('ordersDashboard.charts.kpiEstimated'),
      value: formatCurrencyEUR(est),
      progress: est > 0 ? 100 : 0,
      barColor: '#90a4ae',
      subtitle: estimatedSubtitle,
    },
    {
      title: t('ordersDashboard.charts.kpiCurrent'),
      value: formatCurrencyEUR(total),
      progress: pctEst,
      barColor: '#455a64',
      subtitle:
        est > 0
          ? `${formatStatNumber(pctEst)}% ${t('ordersDashboard.charts.ofEstimate')}`
          : t('ordersDashboard.charts.noEstimate'),
    },
  ];

  for (const [type, rev] of top) {
    const share = total > 0 ? Math.round((rev / total) * 100) : 0;
    const col = colorMap.get(type) || DASHBOARD_CHANNEL_COLORS[0];
    cards.push({
      title: type,
      value: formatCurrencyEUR(rev),
      progress: Math.min(100, share),
      barColor: col,
      subtitle: `${formatStatNumber(share)}% ${t('ordersDashboard.charts.ofTotal')}`,
    });
  }

  while (cards.length < 5) {
    cards.push({ ...PLACEHOLDER_KPI });
  }

  cards.push(buildInsightKpi(est, total, t));

  return cards.slice(0, 6);
}
