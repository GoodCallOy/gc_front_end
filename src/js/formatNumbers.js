/** Round to 2 decimal places for numeric aggregates (fixes float drift before display). */
export function roundTo2Decimals(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Stats / quantities: round to 2 decimal places, avoid float artifacts (e.g. 9.379999…).
 * Always show exactly 2 fraction digits (site-wide numeric display).
 */
export function formatStatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  const rounded = Math.round(n * 100) / 100;
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

export function formatSlashPair(a, b) {
  return `${formatStatNumber(a)} / ${formatStatNumber(b)}`;
}

/** EUR with exactly two fraction digits */
export function formatCurrencyEUR(value) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `€${safe.toFixed(2)}`;
  }
}
