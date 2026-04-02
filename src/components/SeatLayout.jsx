import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { readHomeReturnSnapshot } from "../utils/homeReturnSnapshot";
import { writeBookingCheckoutDraft } from "../utils/bookingCheckoutDraft";
import {
  clearPendingSeatSelection,
  readPendingSeatSelection,
  writePendingSeatSelection,
} from "../utils/pendingSeatSelection";

const MAX_SEATS = 10;

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

function groupSeatsByRow(seats) {
  const map = new Map();
  for (const s of seats) {
    const row = s.rowLabel;
    if (!map.has(row)) map.set(row, []);
    map.get(row).push(s);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.seatNumber - b.seatNumber);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/** Centre gallery aisle: even n → gap after n/2; odd n → gap after (n−1)/2 (same as ⌊n/2⌋). */
function splitRowForGalleryGap(seats) {
  const n = seats.length;
  if (n <= 1) {
    return { left: seats, right: [], showGap: false };
  }
  const split = Math.floor(n / 2);
  return {
    left: seats.slice(0, split),
    right: seats.slice(split),
    showGap: true,
  };
}

function SeatLayout({ showtime, onClose = () => {} }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [holdError, setHoldError] = useState("");
  const [holdLoading, setHoldLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const prevSelectionSize = useRef(0);

  const loadMap = useCallback(() => {
    setLoading(true);
    setError("");
    PublicAPI.get(`/showtimes/${showtime.id}/seats`)
      .then((seatsRes) => {
        const data = seatsRes.data.data;
        setSeatMap(data);
        const pending = readPendingSeatSelection(showtime.id);
        if (pending?.length && data?.seats?.length) {
          const available = new Set(
            data.seats.filter((s) => s.status === "AVAILABLE").map((s) => s.showtimeSeatId)
          );
          const next = new Set();
          for (const id of pending) {
            if (available.has(id)) next.add(id);
          }
          if (next.size > 0) setSelectedIds(next);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not load seats.");
        setSeatMap(null);
      })
      .finally(() => setLoading(false));
  }, [showtime.id]);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  useEffect(() => {
    if (selectedIds.size > 0) {
      writePendingSeatSelection(showtime.id, [...selectedIds]);
    } else if (prevSelectionSize.current > 0) {
      clearPendingSeatSelection();
    }
    prevSelectionSize.current = selectedIds.size;
  }, [selectedIds, showtime.id]);

  const rowsGrouped = useMemo(() => {
    if (!seatMap?.seats?.length) return [];
    return groupSeatsByRow(seatMap.seats);
  }, [seatMap]);

  const price = seatMap?.price != null ? Number(seatMap.price) : Number(showtime.price);
  const seatCount = selectedIds.size;
  const ticketSubtotal = roundMoney(seatCount * price);

  const toggleSeat = (item) => {
    if (item.status !== "AVAILABLE") return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.showtimeSeatId)) {
        next.delete(item.showtimeSeatId);
        return next;
      }
      if (next.size >= MAX_SEATS) return prev;
      next.add(item.showtimeSeatId);
      return next;
    });
  };

  const handlePay = async () => {
    if (selectedIds.size < 1) return;
    setHoldError("");
    writePendingSeatSelection(showtime.id, [...selectedIds]);
    const draft = {
      showtime,
      showtimeSeatIds: [...selectedIds],
      unitPrice: price,
    };
    writeBookingCheckoutDraft(draft);
    if (!user) {
      onClose();
      navigate("/login", {
        state: {
          from: "/booking/checkout",
          home: readHomeReturnSnapshot(),
          reason: "payment",
        },
      });
      return;
    }
    setHoldLoading(true);
    try {
      await PublicAPI.post("/bookings/seat-hold", {
        showtimeSeatIds: [...selectedIds],
      });
      onClose();
      navigate("/booking/checkout", { state: draft });
    } catch (err) {
      setHoldError(err.response?.data?.message || "Could not reserve seats. Try again.");
      loadMap();
    } finally {
      setHoldLoading(false);
    }
  };

  const seatClass = (item) => {
    if (item.status !== "AVAILABLE") return "seat unavailable";
    if (selectedIds.has(item.showtimeSeatId)) return "seat selected";
    return "seat available";
  };

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="seat-layout-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="seat-close-btn" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <div className="seat-header">
          <h2>{showtime.movieTitle}</h2>
          <p>{showtime.theatreName}</p>
          <p className="seat-meta">
            {new Date(showtime.startTime).toLocaleString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {" "}
            &middot; &#8377;{showtime.price}
          </p>
        </div>

        {loading ? (
          <div className="loading">Loading seat map…</div>
        ) : error ? (
          <div className="empty">{error}</div>
        ) : !seatMap ? (
          <div className="empty">No seat data.</div>
        ) : (
          <>
            <div className="screen-indicator">
              <div className="screen-bar" />
              <span>SCREEN</span>
            </div>

            <div className="seat-grid-wrapper">
              {rowsGrouped.map(([rowLabel, seats]) => {
                const { left, right, showGap } = splitRowForGalleryGap(seats);
                const renderSeat = (item) => (
                  <button
                    key={item.showtimeSeatId}
                    type="button"
                    className={seatClass(item)}
                    disabled={item.status !== "AVAILABLE"}
                    onClick={() => toggleSeat(item)}
                    title={`${item.seatLabel} — ${item.status}`}
                  >
                    {item.seatNumber}
                  </button>
                );
                return (
                  <div key={rowLabel} className="seat-row">
                    <span className="row-label">{rowLabel}</span>
                    <div className="seat-row-seats">
                      {left.map(renderSeat)}
                      {showGap && <span className="seat-gallery-gap" aria-hidden="true" />}
                      {right.map(renderSeat)}
                    </div>
                    <span className="row-label">{rowLabel}</span>
                  </div>
                );
              })}
            </div>

            <div className="seat-legend">
              <div className="legend-item">
                <span className="seat available legend-box" />
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="seat selected legend-box" />
                <span>Selected</span>
              </div>
              <div className="legend-item">
                <span className="seat unavailable legend-box" />
                <span>Taken</span>
              </div>
            </div>
          </>
        )}

        {selectedIds.size > 0 && (
          <div className="seat-footer">
            {holdError && <p className="seat-hold-error">{holdError}</p>}
            <div className="seat-footer-actions">
              <button
                type="button"
                className="btn btn-primary seat-pay-btn"
                onClick={handlePay}
                disabled={holdLoading}
              >
                {holdLoading ? "Reserving…" : (
                  <>
                    Pay &#8377;{ticketSubtotal.toFixed(0)}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeatLayout;
