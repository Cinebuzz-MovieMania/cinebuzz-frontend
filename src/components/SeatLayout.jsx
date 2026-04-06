import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { readHomeReturnSnapshot } from "../utils/homeReturnSnapshot";
import {
  clearBookingCheckoutDraft,
  writeBookingCheckoutDraft,
} from "../utils/bookingCheckoutDraft";
import {
  clearPendingSeatSelection,
  readPendingSeatSelection,
  writePendingSeatSelection,
} from "../utils/pendingSeatSelection";

/** Load per-showtime availability (ShowtimeSeat rows + status); not static screen Seat ids. */
const showtimeSeatMapPath = (showtimeId) => `/showtimes/${showtimeId}/showtime-seats`;

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
  const [payNavigating, setPayNavigating] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const prevSelectionSize = useRef(0);

  const uid = user?.userId ?? user?.id;

  const isSelectableSeat = useCallback(
    (item) => {
      if (!item) return false;
      if (item.status === "AVAILABLE") return true;
      if (
        item.status === "LOCKED" &&
        uid != null &&
        item.lockedByUserId != null &&
        Number(item.lockedByUserId) === Number(uid)
      ) {
        return true;
      }
      return false;
    },
    [uid]
  );

  const loadMap = useCallback(() => {
    setLoading(true);
    setError("");
    PublicAPI.get(showtimeSeatMapPath(showtime.id))
      .then((seatsRes) => {
        const data = seatsRes.data.data;
        setSeatMap(data);
        if (!data?.seats?.length) return;
        const available = new Set(
          data.seats.filter((s) => isSelectableSeat(s)).map((s) => s.showtimeSeatId)
        );
        const pending = readPendingSeatSelection(showtime.id);
        if (pending?.length) {
          const next = new Set();
          for (const id of pending) {
            if (available.has(id)) next.add(id);
          }
          setSelectedIds(next);
        } else {
          setSelectedIds((prev) => {
            const next = new Set();
            for (const id of prev) {
              if (available.has(id)) next.add(id);
            }
            return next;
          });
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not load seats.");
        setSeatMap(null);
      })
      .finally(() => setLoading(false));
  }, [showtime.id, isSelectableSeat]);

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
    if (!isSelectableSeat(item)) return;
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

  const goToSeatUnavailable = (message) => {
    clearBookingCheckoutDraft();
    clearPendingSeatSelection();
    onClose();
    navigate("/booking/seats-unavailable", {
      replace: true,
      state: { message },
    });
  };

  const handlePay = async () => {
    if (selectedIds.size < 1) return;
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
    setPayNavigating(true);
    try {
      const seatsRes = await PublicAPI.get(showtimeSeatMapPath(showtime.id));
      const mapData = seatsRes.data.data;
      const seats = mapData?.seats ?? [];
      const chosen = [...selectedIds];
      const blocked = chosen.filter((id) => {
        const row = seats.find((s) => s.showtimeSeatId === id);
        return !row || !isSelectableSeat(row);
      });
      if (blocked.length > 0) {
        goToSeatUnavailable("Sorry! These seats are no more available.");
        return;
      }

      await PublicAPI.post("/bookings/hold", { showtimeSeatIds: chosen });

      onClose();
      navigate("/booking/checkout", { state: draft });
    } catch (err) {
      goToSeatUnavailable(
        err.response?.data?.message
          || "Sorry! These seats are no more available."
      );
    } finally {
      setPayNavigating(false);
    }
  };

  const seatClass = (item) => {
    const mine =
      uid != null &&
      item.lockedByUserId != null &&
      Number(item.lockedByUserId) === Number(uid);
    if (item.status === "LOCKED" && !mine) return "seat locked";
    if (item.status === "BOOKED") return "seat unavailable";
    if (item.status === "LOCKED" && mine) {
      return selectedIds.has(item.showtimeSeatId) ? "seat selected" : "seat available";
    }
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
                    disabled={!isSelectableSeat(item)}
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
                <span className="seat locked legend-box" />
                <span>Locked</span>
              </div>
              <div className="legend-item">
                <span className="seat unavailable legend-box" />
                <span>Booked</span>
              </div>
            </div>
          </>
        )}

        {selectedIds.size > 0 && (
          <div className="seat-footer">
            <div className="seat-footer-actions">
              <button
                type="button"
                className="btn btn-primary seat-pay-btn"
                onClick={handlePay}
                disabled={payNavigating}
              >
                {payNavigating ? "Continue…" : (
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
