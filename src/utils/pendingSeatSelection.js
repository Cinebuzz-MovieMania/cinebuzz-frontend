const KEY = "cinebuzz_pending_seats";

export function writePendingSeatSelection(showtimeId, showtimeSeatIds) {
  if (!showtimeId || !showtimeSeatIds?.length) {
    sessionStorage.removeItem(KEY);
    return;
  }
  sessionStorage.setItem(
    KEY,
    JSON.stringify({ showtimeId, showtimeSeatIds: [...showtimeSeatIds] })
  );
}

export function readPendingSeatSelection(showtimeId) {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (Number(o.showtimeId) !== Number(showtimeId)) return null;
    return Array.isArray(o.showtimeSeatIds) ? o.showtimeSeatIds : [];
  } catch {
    return null;
  }
}

export function clearPendingSeatSelection() {
  sessionStorage.removeItem(KEY);
}
