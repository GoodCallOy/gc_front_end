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

/** True when a case unit represents hours (the only unit type that needs decimals). */
export function isHoursCaseUnit(unit) {
  return /^\s*(hours?|hrs?|h)\s*$/i.test(String(unit || ''));
}

/**
 * Format a unit quantity based on its case unit:
 * hours-based cases keep 2 decimals, every other unit type shows a whole number.
 */
export function formatUnitsByCaseUnit(value, caseUnit) {
  if (isHoursCaseUnit(caseUnit)) return formatStatNumber(value);
  const n = Number(value);
  const safe = Number.isFinite(n) ? Math.round(n) : 0;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(safe);
}

/** Slash pair ("completed / goal") formatted per case unit (decimals only for hours). */
export function formatSlashPairByCaseUnit(a, b, caseUnit) {
  return `${formatUnitsByCaseUnit(a, caseUnit)} / ${formatUnitsByCaseUnit(b, caseUnit)}`;
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
