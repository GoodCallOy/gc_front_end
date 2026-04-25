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
