const KEY = "cinebuzz_checkout_draft";

/**
 * Persists checkout payload so returning from login (or refresh) can load /booking/checkout.
 * @param {{ showtime: object, showtimeSeatIds: number[], unitPrice: number }} draft
 */
export function writeBookingCheckoutDraft(draft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function readBookingCheckoutDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearBookingCheckoutDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
