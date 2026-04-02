/**
 * Formats stored duration (minutes) as hours + minutes for display.
 * @param {number|string|null|undefined} minutes
 * @returns {string} e.g. "2h 15m", "1 hr", "45 min"
 */
export function formatRuntimeMinutes(minutes) {
  const n = Math.floor(Number(minutes));
  if (Number.isNaN(n) || n < 0) return "—";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h}h ${m}m`;
}
