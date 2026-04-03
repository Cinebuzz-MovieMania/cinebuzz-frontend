import { Link, useLocation } from "react-router-dom";

const DEFAULT_MESSAGE = "Sorry! These seats are no more available.";

/** Shown when selected seats are no longer available before checkout (e.g. taken by another booking). */
function BookingSeatUnavailable() {
  const location = useLocation();
  const message =
    typeof location.state?.message === "string" && location.state.message.trim()
      ? location.state.message.trim()
      : DEFAULT_MESSAGE;

  return (
    <div className="page booking-checkout-page">
      <div className="booking-checkout-card">
        <h1 className="booking-checkout-title">Sorry — no seats available</h1>
        <p className="booking-checkout-error-msg">{message}</p>
        <Link to="/" className="btn btn-primary booking-checkout-continue" replace>
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default BookingSeatUnavailable;
