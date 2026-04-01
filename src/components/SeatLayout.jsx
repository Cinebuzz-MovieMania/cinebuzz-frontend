import { useEffect, useState } from "react";
import API from "../services/api";

function SeatLayout({ showtime, theatres, onClose }) {
  const [screenInfo, setScreenInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const theatre = theatres.find((t) => t.name === showtime.theatreName);
    if (!theatre) { setLoading(false); return; }

    API.get(`/screens/theatre/${theatre.id}`)
      .then((res) => {
        const screens = res.data.data || [];
        const screen = screens.find((s) => s.id === showtime.screenId);
        if (screen) setScreenInfo(screen);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [showtime, theatres]);

  const rowLabel = (i) => String.fromCharCode(65 + i);

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="seat-layout-card" onClick={(e) => e.stopPropagation()}>
        <button className="seat-close-btn" onClick={onClose}>&times;</button>

        <div className="seat-header">
          <h2>{showtime.movieTitle}</h2>
          <p>{showtime.theatreName} &middot; {showtime.screenName}</p>
          <p className="seat-meta">
            {new Date(showtime.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            {" "}&middot; &#8377;{showtime.price}
          </p>
        </div>

        {loading ? (
          <div className="loading">Loading seat layout...</div>
        ) : !screenInfo ? (
          <div className="empty">Could not load screen info.</div>
        ) : (
          <>
            <div className="screen-indicator">
              <div className="screen-bar" />
              <span>SCREEN</span>
            </div>

            <div className="seat-grid-wrapper">
              {Array.from({ length: screenInfo.totalRows }, (_, rowIdx) => (
                <div key={rowIdx} className="seat-row">
                  <span className="row-label">{rowLabel(rowIdx)}</span>
                  <div className="seat-row-seats">
                    {Array.from({ length: screenInfo.seatsPerRow }, (_, seatIdx) => (
                      <div key={seatIdx} className="seat available" title={`${rowLabel(rowIdx)}${seatIdx + 1}`}>
                        {seatIdx + 1}
                      </div>
                    ))}
                  </div>
                  <span className="row-label">{rowLabel(rowIdx)}</span>
                </div>
              ))}
            </div>

            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat available legend-box" />
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="seat-count">{screenInfo.totalSeats} total seats</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SeatLayout;
