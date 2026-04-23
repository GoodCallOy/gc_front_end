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
