import { PublicAPI } from "../services/api";
import {
  clearBookingCheckoutDraft,
  readBookingCheckoutDraft,
} from "./bookingCheckoutDraft";
import { clearPendingSeatSelection } from "./pendingSeatSelection";

/**
 * Releases server-side LOCKED seats for the current user (no-op if request fails).
 */
export async function releaseSeatHold(showtimeSeatIds) {
  if (!showtimeSeatIds?.length) return;
  try {
    await PublicAPI.post("/bookings/seat-hold/release", {
      showtimeSeatIds,
    });
  } catch {
    /* ignore — best effort */
  }
}

/**
 * Reads checkout draft from sessionStorage, releases those seats, clears draft.
 */
export async function releaseCheckoutDraftHolds() {
  const draft = readBookingCheckoutDraft();
  const ids = draft?.showtimeSeatIds;
  if (!ids?.length) return;
  await releaseSeatHold(ids);
  clearBookingCheckoutDraft();
  clearPendingSeatSelection();
}
