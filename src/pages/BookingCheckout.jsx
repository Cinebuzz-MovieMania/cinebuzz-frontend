import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { PublicAPI } from "../services/api";
import {
  clearBookingCheckoutDraft,
  readBookingCheckoutDraft,
} from "../utils/bookingCheckoutDraft";
import { clearPendingSeatSelection } from "../utils/pendingSeatSelection";
import { releaseCheckoutDraftHolds } from "../utils/releaseSeatHold";

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

function formatShowMeta(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function BookingCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [holdReady, setHoldReady] = useState(false);

  const draft = useMemo(() => {
    const fromState = location.state;
    if (fromState?.showtimeSeatIds?.length) return fromState;
    return readBookingCheckoutDraft();
  }, [location.state]);

  const showtime = draft?.showtime;
  const ids = draft?.showtimeSeatIds;
  const unitPrice = draft?.unitPrice != null ? Number(draft.unitPrice) : NaN;

  const seatCount = ids?.length ?? 0;
  const total = roundMoney(seatCount * unitPrice);

  const idsKey = useMemo(() => (ids?.length ? ids.join(",") : ""), [ids]);

  useEffect(() => {
    if (!ids?.length) return;
    let cancelled = false;
    setHoldReady(false);
    setError("");
    (async () => {
      try {
        await PublicAPI.post("/bookings/hold", { showtimeSeatIds: ids });
        if (!cancelled) setHoldReady(true);
      } catch (err) {
        const msg =
          err.response?.data?.message
          || err.message
          || "Sorry! These seats are no more available.";
        clearBookingCheckoutDraft();
        clearPendingSeatSelection();
        if (!cancelled) {
          navigate("/booking/seats-unavailable", { replace: true, state: { message: msg } });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey, ids, navigate]);

  if (!draft || !showtime || !ids?.length || Number.isNaN(unitPrice)) {
    return <Navigate to="/" replace />;
  }

  const handleCancelLeave = async (e) => {
    e.preventDefault();
    await releaseCheckoutDraftHolds();
    navigate("/");
  };

  const handleContinue = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await PublicAPI.post("/bookings", {
        showtimeSeatIds: ids,
      });
      const data = res.data.data;
      clearBookingCheckoutDraft();
      clearPendingSeatSelection();
      navigate("/booking/confirmation", { state: { booking: data }, replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message
          || err.message
          || "Sorry! These seats are no more available."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page booking-checkout-page">
      <div className="booking-checkout-card">
        <h1 className="booking-checkout-title">Review &amp; pay</h1>

        <section className="booking-checkout-movie-block">
          <h2 className="booking-checkout-movie-title">{showtime.movieTitle}</h2>
          <p className="booking-checkout-theatre">{showtime.theatreName}</p>
          <p className="booking-checkout-meta">
            {formatShowMeta(showtime.startTime)}
            {" "}
            &middot; &#8377;{unitPrice} per ticket
          </p>
        </section>

        <section className="booking-checkout-breakdown">
          <h3 className="booking-checkout-section-heading">Amount</h3>
          <dl className="booking-checkout-dl">
            <div>
              <dt>Tickets ({seatCount})</dt>
              <dd>&#8377;{total.toFixed(0)}</dd>
            </div>
            <div className="booking-checkout-total-row">
              <dt>Total</dt>
              <dd>&#8377;{total.toFixed(0)}</dd>
            </div>
          </dl>
        </section>

        {!holdReady && (
          <p className="booking-checkout-hold-status">Securing your seats…</p>
        )}

        {error && <p className="booking-checkout-error">{error}</p>}

        <div className="booking-checkout-actions">
          <button
            type="button"
            className="btn btn-primary booking-checkout-continue"
            onClick={handleContinue}
            disabled={submitting || !holdReady}
          >
            {submitting ? "Processing…" : "Confirm booking"}
          </button>
          <button type="button" className="booking-checkout-cancel" onClick={handleCancelLeave}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingCheckout;
