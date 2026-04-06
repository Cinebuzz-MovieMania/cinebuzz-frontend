import { PublicAPI } from "../services/api";
import {
  clearBookingCheckoutDraft,
  readBookingCheckoutDraft,
} from "./bookingCheckoutDraft";
import { clearPendingSeatSelection } from "./pendingSeatSelection";

/**
 * Releases server-side seat holds for the current checkout draft, then clears local draft state.
 */
export async function releaseCheckoutDraftHolds() {
  const draft = readBookingCheckoutDraft();
  if (!draft?.showtimeSeatIds?.length) {
    clearBookingCheckoutDraft();
    clearPendingSeatSelection();
    return;
  }
  try {
    await PublicAPI.post("/bookings/release-hold", {
      showtimeSeatIds: draft.showtimeSeatIds,
    });
  } catch {
    /* best-effort; TTL will expire holds server-side */
  }
  clearBookingCheckoutDraft();
  clearPendingSeatSelection();
}
