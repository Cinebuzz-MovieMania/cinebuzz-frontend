import {
  clearBookingCheckoutDraft,
  readBookingCheckoutDraft,
} from "./bookingCheckoutDraft";
import { clearPendingSeatSelection } from "./pendingSeatSelection";

/**
 * Clears checkout draft and pending seat selection (no server seat locks).
 */
export async function releaseCheckoutDraftHolds() {
  const draft = readBookingCheckoutDraft();
  if (draft?.showtimeSeatIds?.length) {
    clearBookingCheckoutDraft();
    clearPendingSeatSelection();
  }
}
