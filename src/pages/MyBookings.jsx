import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicAPI } from "../services/api";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    PublicAPI.get("/bookings")
      .then((res) => {
        if (!cancelled) setBookings(res.data.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || "Could not load bookings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page my-bookings-page">
        <p className="my-bookings-status">Loading your bookings…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page my-bookings-page">
        <p className="my-bookings-error">{error}</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="page my-bookings-page">
        <h1 className="my-bookings-title">My bookings</h1>
        <p className="my-bookings-empty">You don&apos;t have any bookings yet.</p>
        <Link to="/" className="btn btn-primary">Browse movies</Link>
      </div>
    );
  }

  return (
    <div className="page my-bookings-page">
      <h1 className="my-bookings-title">My bookings</h1>
      <ul className="my-bookings-list">
        {bookings.map((b) => (
          <li key={b.bookingId} className="my-bookings-card">
            <div className="my-bookings-card-header">
              <span className="my-bookings-movie">{b.movieTitle}</span>
              <span className="my-bookings-id">#{b.bookingId}</span>
            </div>
            <dl className="my-bookings-dl">
              <div>
                <dt>Theatre</dt>
                <dd>{b.theatreName}</dd>
              </div>
              <div>
                <dt>Screen</dt>
                <dd>{b.screenName}</dd>
              </div>
              <div>
                <dt>Show time</dt>
                <dd>{formatWhen(b.startTime)}</dd>
              </div>
              <div>
                <dt>Seats</dt>
                <dd>{b.seatLabels?.join(", ") || "—"}</dd>
              </div>
              {b.ticketSubtotal != null && (
                <div>
                  <dt>Ticket subtotal</dt>
                  <dd>&#8377;{Number(b.ticketSubtotal).toFixed(0)}</dd>
                </div>
              )}
              {b.convenienceFee != null && Number(b.convenienceFee) > 0 && (
                <div>
                  <dt>Convenience fee</dt>
                  <dd>&#8377;{Number(b.convenienceFee).toFixed(0)}</dd>
                </div>
              )}
              <div>
                <dt>Total</dt>
                <dd className="booking-amount">&#8377;{Number(b.totalAmount).toFixed(0)}</dd>
              </div>
              <div>
                <dt>Booked on</dt>
                <dd>{formatWhen(b.createdAt)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MyBookings;
