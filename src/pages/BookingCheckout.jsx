import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { PublicAPI } from "../services/api";
import {
  clearBookingCheckoutDraft,
  readBookingCheckoutDraft,
} from "../utils/bookingCheckoutDraft";
import { clearPendingSeatSelection } from "../utils/pendingSeatSelection";
import { releaseCheckoutDraftHolds, releaseSeatHold } from "../utils/releaseSeatHold";

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

function formatHoldExpiry(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function BookingCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [convenienceFeeRate, setConvenienceFeeRate] = useState(0.1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [holdState, setHoldState] = useState("loading");
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);

  const bookingFinishedRef = useRef(false);
  const seatIdsForHoldRef = useRef([]);

  const draft = useMemo(() => {
    const fromState = location.state;
    if (fromState?.showtimeSeatIds?.length) return fromState;
    return readBookingCheckoutDraft();
  }, [location.state]);

  const seatIdsKey = useMemo(
    () => (draft?.showtimeSeatIds ? draft.showtimeSeatIds.join(",") : ""),
    [draft]
  );

  useEffect(() => {
    PublicAPI.get("/booking-pricing")
      .then((res) => {
        const r = res?.data?.data?.convenienceFeeRate;
        if (r != null && !Number.isNaN(Number(r))) setConvenienceFeeRate(Number(r));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!seatIdsKey) return;
    setHoldState("loading");
    let cancelled = false;
    PublicAPI.post("/bookings/seat-hold", {
      showtimeSeatIds: draft.showtimeSeatIds,
    })
      .then((res) => {
        if (!cancelled) {
          setHoldExpiresAt(res.data.data?.holdExpiresAt ?? null);
          setHoldState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setHoldState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [seatIdsKey, draft]);

  const showtime = draft?.showtime;
  const ids = draft?.showtimeSeatIds;
  const unitPrice = draft?.unitPrice != null ? Number(draft.unitPrice) : NaN;

  useEffect(() => {
    if (holdState === "ready" && ids?.length) {
      seatIdsForHoldRef.current = ids;
    }
  }, [holdState, ids]);

  useEffect(() => {
    return () => {
      if (bookingFinishedRef.current) return;
      const toRelease = seatIdsForHoldRef.current;
      if (!toRelease?.length) return;
      releaseSeatHold(toRelease);
    };
  }, []);

  const seatCount = ids?.length ?? 0;
  const ticketSubtotal = roundMoney(seatCount * unitPrice);
  const convenienceFee = roundMoney(ticketSubtotal * convenienceFeeRate);
  const total = roundMoney(ticketSubtotal + convenienceFee);

  if (!draft || !showtime || !ids?.length || Number.isNaN(unitPrice)) {
    return <Navigate to="/" replace />;
  }

  const handleCancelLeave = async (e) => {
    e.preventDefault();
    bookingFinishedRef.current = true;
    await releaseCheckoutDraftHolds();
    navigate("/");
  };

  if (holdState === "loading") {
    return (
      <div className="page booking-checkout-page">
        <div className="booking-checkout-card booking-checkout-loading">
          <p className="booking-checkout-status">Reserving your seats…</p>
        </div>
      </div>
    );
  }

  if (holdState === "error") {
    return (
      <div className="page booking-checkout-page">
        <div className="booking-checkout-card">
          <h1 className="booking-checkout-title">Couldn&apos;t reserve seats</h1>
          <p className="booking-checkout-error-msg">
            Seats may have been taken or your session expired. Go back and choose seats again.
          </p>
          <Link to="/" className="btn btn-primary booking-checkout-continue">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const handleContinue = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await PublicAPI.post("/bookings", {
        showtimeSeatIds: ids,
      });
      const data = res.data.data;
      bookingFinishedRef.current = true;
      clearBookingCheckoutDraft();
      clearPendingSeatSelection();
      navigate("/booking/confirmation", { state: { booking: data }, replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page booking-checkout-page">
      <div className="booking-checkout-card">
        <h1 className="booking-checkout-title">Review &amp; pay</h1>

        {holdExpiresAt && (
          <p className="booking-checkout-hold-note">
            Seats reserved until {formatHoldExpiry(holdExpiresAt)}
          </p>
        )}

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
              <dt>Ticket amount</dt>
              <dd>&#8377;{ticketSubtotal.toFixed(0)}</dd>
            </div>
            <div>
              <dt>Convenience fee</dt>
              <dd>&#8377;{convenienceFee.toFixed(0)}</dd>
            </div>
            <div className="booking-checkout-total-row">
              <dt>Total</dt>
              <dd>&#8377;{total.toFixed(0)}</dd>
            </div>
          </dl>
        </section>

        {error && <p className="booking-checkout-error">{error}</p>}

        <div className="booking-checkout-actions">
          <button
            type="button"
            className="btn btn-primary booking-checkout-continue"
            onClick={handleContinue}
            disabled={submitting}
          >
            {submitting ? "Processing…" : "Continue"}
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
