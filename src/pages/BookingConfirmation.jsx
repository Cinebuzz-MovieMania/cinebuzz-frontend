import { Link, useLocation, Navigate } from "react-router-dom";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking?.bookingId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page booking-confirmation-page">
      <div className="booking-confirmation-card">
        <div className="booking-confirmation-icon" aria-hidden="true">
          ✓
        </div>
        <h1>Booking confirmed</h1>
        <p className="booking-confirmation-id">Booking #{booking.bookingId}</p>

        <dl className="booking-confirmation-details">
          <div>
            <dt>Guest</dt>
            <dd>{booking.userName}</dd>
          </div>
          <div>
            <dt>Movie</dt>
            <dd>{booking.movieTitle}</dd>
          </div>
          <div>
            <dt>Theatre</dt>
            <dd>{booking.theatreName}</dd>
          </div>
          <div>
            <dt>Screen</dt>
            <dd>{booking.screenName}</dd>
          </div>
          <div>
            <dt>Show time</dt>
            <dd>{formatWhen(booking.startTime)}</dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd className="booking-seat-list">{booking.seatLabels?.join(", ") || "—"}</dd>
          </div>
          {booking.ticketSubtotal != null && (
            <div>
              <dt>Ticket subtotal</dt>
              <dd>&#8377;{Number(booking.ticketSubtotal).toFixed(0)}</dd>
            </div>
          )}
          <div>
            <dt>Total paid</dt>
            <dd className="booking-amount">&#8377;{Number(booking.totalAmount).toFixed(0)}</dd>
          </div>
          <div>
            <dt>Booked on</dt>
            <dd>{formatWhen(booking.createdAt)}</dd>
          </div>
        </dl>

        <Link to="/" className="btn btn-primary booking-confirmation-home">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default BookingConfirmation;
