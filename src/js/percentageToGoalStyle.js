/**
 * CSS class for % to goal badges (orders dashboard, agent dashboard, assign goals).
 * Thresholds match ordersDashboard: ≤25 red, ≤50 orange, ≤75 yellow, >75 green.
 */
export function getPercentageToGoalBadgeClass(percent) {
  const pct = Number(percent);
  if (!Number.isFinite(pct) || Number.isNaN(pct)) {
    return 'percentage-red';
  }
  if (pct <= 25) return 'percentage-red';
  if (pct <= 50) return 'percentage-orange';
  if (pct <= 75) return 'percentage-yellow';
  return 'percentage-green';
}

/**
 * Vuetify `color` for progress bars: same thresholds as getPercentageToGoalBadgeClass.
 * Use from template / methods: getPercentageToGoalVuetifyColor(caseProgressPercent(c))
 */
export function getPercentageToGoalVuetifyColor(percent) {
  const cls = getPercentageToGoalBadgeClass(percent);
  if (cls === 'percentage-red') return 'error';
  if (cls === 'percentage-orange') return 'orange';
  if (cls === 'percentage-yellow') return 'amber';
  if (cls === 'percentage-green') return 'success';
  return 'error';
}

/** Hex fill for KPI progress bars (matches badge thresholds). */
export function getPercentageToGoalBarColor(percent) {
  const cls = getPercentageToGoalBadgeClass(percent);
  if (cls === 'percentage-red') return '#c62828';
  if (cls === 'percentage-orange') return '#ef6c00';
  if (cls === 'percentage-yellow') return '#f9a825';
  if (cls === 'percentage-green') return '#2e7d32';
  return '#c62828';
}
