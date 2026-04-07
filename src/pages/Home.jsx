import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API, { PublicAPI } from "../services/api";
import SeatLayout from "../components/SeatLayout";
import { AuthBackButton } from "../components/AuthBackButton";
import { useCity } from "../context/CityContext";
import { writeHomeReturnSnapshot } from "../utils/homeReturnSnapshot";
import { formatRuntimeMinutes } from "../utils/formatRuntime";

function getLocalDateKey(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildSevenDaysFromToday() {
  const days = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push({ date: d, key: getLocalDateKey(d) });
  }
  return days;
}

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const restoreHandledKeyRef = useRef(null);

  const [cities, setCities] = useState([]);
  const [browseRows, setBrowseRows] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { selectedCity, showCityPicker, selectCity, openCityPicker, closeCityPicker } = useCity();
  const [citySearch, setCitySearch] = useState("");

  const [focusMovie, setFocusMovie] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [castList, setCastList] = useState([]);
  const [castLoading, setCastLoading] = useState(false);
  /** { loading, error, person, subtitle } | null */
  const [personModal, setPersonModal] = useState(null);

  const [selectedDateKey, setSelectedDateKey] = useState(() => getLocalDateKey(new Date()));
  const [viewingShowtime, setViewingShowtime] = useState(null);

  const [movieDayShowtimes, setMovieDayShowtimes] = useState([]);
  const [movieDayLoading, setMovieDayLoading] = useState(false);

  const sevenDays = buildSevenDaysFromToday();

  useEffect(() => {
    API.get("/cities")
      .then((citiesRes) => {
        setCities(citiesRes.data.data || []);
      })
      .catch((err) => console.error("Error loading data", err))
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCity?.id) {
      setBrowseRows([]);
      return;
    }
    let cancelled = false;
    setBrowseLoading(true);
    PublicAPI.get("/browse/movies", { params: { cityId: selectedCity.id } })
      .then((res) => {
        if (!cancelled) setBrowseRows(res.data.data || []);
      })
      .catch((err) => {
        console.error("Browse movies", err);
        if (!cancelled) setBrowseRows([]);
      })
      .finally(() => {
        if (!cancelled) setBrowseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCity?.id]);

  useEffect(() => {
    if (!focusMovie?.id) {
      setCastList([]);
      return;
    }
    setCastLoading(true);
    PublicAPI.get(`/admin/movies/${focusMovie.id}/cast`)
      .then((res) => setCastList(res.data.data || []))
      .catch(() => setCastList([]))
      .finally(() => setCastLoading(false));
  }, [focusMovie?.id]);

  useEffect(() => {
    writeHomeReturnSnapshot({
      focusMovieId: focusMovie?.id ?? null,
      bookingOpen,
      selectedDateKey,
      viewingShowtimeId: viewingShowtime?.id ?? null,
    });
  }, [focusMovie, bookingOpen, selectedDateKey, viewingShowtime]);

  useEffect(() => {
    if (!bookingOpen || !focusMovie?.id || !selectedCity?.id || !selectedDateKey) {
      setMovieDayShowtimes([]);
      return;
    }
    let cancelled = false;
    setMovieDayLoading(true);
    PublicAPI.get("/browse/showtimes", {
      params: {
        cityId: selectedCity.id,
        movieId: focusMovie.id,
        date: selectedDateKey,
      },
    })
      .then((res) => {
        if (!cancelled) setMovieDayShowtimes(res.data.data || []);
      })
      .catch((err) => {
        console.error("Browse showtimes", err);
        if (!cancelled) setMovieDayShowtimes([]);
      })
      .finally(() => {
        if (!cancelled) setMovieDayLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingOpen, focusMovie?.id, selectedCity?.id, selectedDateKey]);

  useEffect(() => {
    const r = location.state?.restoreHome;
    if (!r) {
      restoreHandledKeyRef.current = null;
      return;
    }
    const key = JSON.stringify(r);
    if (restoreHandledKeyRef.current === key) return;

    let cancelled = false;
    (async () => {
      try {
        if (r.focusMovieId != null) {
          const movieRes = await API.get(`/movies/${r.focusMovieId}`);
          if (cancelled) return;
          const movie = movieRes.data.data;
          if (!movie) {
            restoreHandledKeyRef.current = key;
            navigate("/", { replace: true, state: {} });
            return;
          }
          setFocusMovie(movie);
          setBookingOpen(!!r.bookingOpen);
          if (r.selectedDateKey) setSelectedDateKey(r.selectedDateKey);
        }
        if (r.viewingShowtimeId != null) {
          const stRes = await PublicAPI.get(`/browse/showtimes/${r.viewingShowtimeId}`);
          if (cancelled) return;
          setViewingShowtime(stRes.data.data ?? null);
        } else {
          setViewingShowtime(null);
        }
        restoreHandledKeyRef.current = key;
        navigate(location.pathname, { replace: true, state: {} });
      } catch {
        restoreHandledKeyRef.current = key;
        navigate(location.pathname, { replace: true, state: {} });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.state, location.pathname, navigate]);

  const movieShowtimesByTheatre = movieDayShowtimes.reduce((acc, s) => {
    if (!acc[s.theatreName]) acc[s.theatreName] = [];
    acc[s.theatreName].push(s);
    return acc;
  }, {});

  Object.keys(movieShowtimesByTheatre).forEach((name) => {
    movieShowtimesByTheatre[name].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  });

  const formatTimeOnly = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const actors = castList.filter((c) => c.role === "ACTOR");
  const crew = castList.filter((c) => c.role !== "ACTOR");

  const formatReleaseDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d + (typeof d === "string" && d.length <= 10 ? "T12:00:00" : "")).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  const formatCrewRole = (role) => (typeof role === "string" ? role.replace(/_/g, " ") : String(role));

  useEffect(() => {
    if (!personModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPersonModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [personModal]);

  const handleCitySelect = (city) => {
    selectCity(city);
    setFocusMovie(null);
    setBookingOpen(false);
  };

  const openMovieCard = (movie) => {
    if (showCityPicker) return;
    setFocusMovie(movie);
    setBookingOpen(false);
  };

  const closeMovieDetail = () => {
    setFocusMovie(null);
    setBookingOpen(false);
    setPersonModal(null);
  };

  const closePersonDetail = () => setPersonModal(null);

  const openPersonDetail = (personId, subtitle) => {
    setPersonModal({ loading: true, error: null, person: null, subtitle: subtitle || "" });
    PublicAPI.get(`/browse/persons/${personId}`)
      .then((res) => {
        setPersonModal((prev) => ({
          ...prev,
          loading: false,
          person: res.data.data,
          error: null,
        }));
      })
      .catch((err) => {
        setPersonModal((prev) => ({
          ...prev,
          loading: false,
          error: err.response?.data?.message || "Could not load profile.",
        }));
      });
  };

  const startBooking = () => {
    setBookingOpen(true);
    setSelectedDateKey(getLocalDateKey(new Date()));
  };

  const backFromBooking = () => {
    setBookingOpen(false);
  };

  if (initialLoading) return <div className="loading">Loading...</div>;

  if (bookingOpen && focusMovie) {
    const theatreNames = Object.keys(movieShowtimesByTheatre).sort((a, b) => a.localeCompare(b));

    return (
      <div className="page">
        <div className="step-header">
          <button type="button" className="back-btn" onClick={backFromBooking}>
            &larr; Back to movie
          </button>
        </div>

        <div className="selected-movie-banner">
          <div className="banner-poster">
            {focusMovie.posterUrl ? (
              <img src={focusMovie.posterUrl} alt={focusMovie.title} />
            ) : (
              <span className="poster-placeholder">🎬</span>
            )}
          </div>
          <div className="banner-info">
            <h1>{focusMovie.title}</h1>
            <p className="banner-meta">
              {focusMovie.genre} &middot; {focusMovie.language} &middot; {formatRuntimeMinutes(focusMovie.durationMinutes)}
            </p>
          </div>
          <div className="date-strip-wrap">
            <p className="date-strip-label">Pick a date</p>
            <div className="date-strip" role="tablist" aria-label="Show dates">
              {sevenDays.map(({ date, key }) => {
                const isToday = key === getLocalDateKey(new Date());
                const isSelected = key === selectedDateKey;
                const dayName = date.toLocaleDateString("en-IN", { weekday: "short" });
                const dayNum = date.getDate();
                const monthShort = date.toLocaleDateString("en-IN", { month: "short" });
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`date-chip ${isSelected ? "active" : ""} ${isToday ? "today" : ""}`}
                    onClick={() => setSelectedDateKey(key)}
                  >
                    <span className="date-chip-day">{dayName}</span>
                    <span className="date-chip-num">{dayNum}</span>
                    <span className="date-chip-month">{monthShort}</span>
                    {isToday && <span className="date-chip-badge">Today</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <h2 className="shows-section-title">
          Shows on{" "}
          {new Date(selectedDateKey + "T12:00:00").toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          <span className="shows-theatre-count">
            {theatreNames.length} {theatreNames.length === 1 ? "theatre" : "theatres"}
          </span>
        </h2>

        {movieDayLoading ? (
          <div className="loading">Loading showtimes…</div>
        ) : theatreNames.length === 0 ? (
          <div className="empty date-empty">
            No shows for this movie on this date.
          </div>
        ) : (
          <div className="theatre-date-layout">
            {theatreNames.map((theatreName) => {
              const shows = movieShowtimesByTheatre[theatreName];
              return (
                <div key={theatreName} className="theatre-date-row">
                  <div className="theatre-date-row-name">{theatreName}</div>
                  <div className="theatre-date-row-shows">
                    {shows.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="showtime-mini-box"
                        onClick={() => setViewingShowtime(s)}
                        aria-label={`${formatTimeOnly(s.startTime)}, ₹${s.price}, ${s.availableSeats} seats available`}
                      >
                        <span className="showtime-mini-time">{formatTimeOnly(s.startTime)}</span>
                        <span className="showtime-mini-tooltip" aria-hidden="true">
                          <span className="showtime-mini-price">&#8377;{s.price}</span>
                          <span className="showtime-mini-seats">{s.availableSeats} seats</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewingShowtime && (
          <SeatLayout
            showtime={viewingShowtime}
            onClose={() => setViewingShowtime(null)}
          />
        )}
      </div>
    );
  }

  if (focusMovie && !bookingOpen) {
    const m = focusMovie;
    return (
      <div className="page movie-detail-fullpage">
        <div className="movie-detail-topbar">
          <button type="button" className="back-btn movie-detail-back" onClick={closeMovieDetail}>
            &larr; Back to movies
          </button>
        </div>

        <section className="movie-detail-hero">
          <div className="movie-detail-hero-poster">
            {m.posterUrl ? (
              <img src={m.posterUrl} alt={m.title} />
            ) : (
              <span className="poster-placeholder">🎬</span>
            )}
          </div>
          <div className="movie-detail-hero-info">
            <h1 className="movie-detail-title">{m.title}</h1>
            <p className="movie-detail-genre">{m.genre} &middot; {m.language}</p>
            <div className="movie-detail-facts">
              <div className="movie-detail-fact">
                <span className="movie-detail-fact-label">Release date</span>
                <span className="movie-detail-fact-value">{formatReleaseDate(m.releaseDate)}</span>
              </div>
              <div className="movie-detail-fact">
                <span className="movie-detail-fact-label">Runtime</span>
                <span className="movie-detail-fact-value">{formatRuntimeMinutes(m.durationMinutes)}</span>
              </div>
            </div>
            {m.description && <p className="movie-detail-about">{m.description}</p>}
          </div>
          <div className="movie-detail-book-wrap">
            <button type="button" className="btn btn-primary movie-detail-book-cta" onClick={startBooking}>
              Book tickets
            </button>
          </div>
        </section>

        {castLoading ? (
          <p className="movie-detail-loading">Loading cast &amp; crew…</p>
        ) : (
          <>
            {actors.length > 0 && (
              <section className="movie-detail-section">
                <h2 className="movie-detail-section-title">Cast</h2>
                <div className="movie-detail-people-grid">
                  {actors.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="movie-person-card"
                      onClick={() =>
                        openPersonDetail(
                          a.personId,
                          a.characterName ? `as ${a.characterName}` : ""
                        )
                      }
                    >
                      <div className="movie-person-photo">
                        {a.profilePictureUrl ? (
                          <img src={a.profilePictureUrl} alt={a.personName} />
                        ) : (
                          <span className="movie-person-placeholder">👤</span>
                        )}
                      </div>
                      <p className="movie-person-name">{a.personName}</p>
                      {a.characterName && (
                        <p className="movie-person-sub">as {a.characterName}</p>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {crew.length > 0 && (
              <section className="movie-detail-section">
                <h2 className="movie-detail-section-title">Crew</h2>
                <div className="movie-detail-people-grid">
                  {crew.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="movie-person-card"
                      onClick={() =>
                        openPersonDetail(c.personId, formatCrewRole(c.role))
                      }
                    >
                      <div className="movie-person-photo">
                        {c.profilePictureUrl ? (
                          <img src={c.profilePictureUrl} alt={c.personName} />
                        ) : (
                          <span className="movie-person-placeholder">👤</span>
                        )}
                      </div>
                      <p className="movie-person-name">{c.personName}</p>
                      <p className="movie-person-sub">{formatCrewRole(c.role)}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {actors.length === 0 && crew.length === 0 && (
              <p className="movie-detail-empty">Cast and crew not listed yet.</p>
            )}
          </>
        )}

        {personModal && (
          <div
            className="person-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="person-modal-title"
            onClick={closePersonDetail}
          >
            <div className="person-modal-card" onClick={(e) => e.stopPropagation()}>
              <AuthBackButton onClick={closePersonDetail} />
              {personModal.loading && <p className="person-modal-loading">Loading…</p>}
              {personModal.error && <p className="person-modal-error">{personModal.error}</p>}
              {!personModal.loading && !personModal.error && personModal.person && (
                <>
                  <div className="person-modal-photo">
                    {personModal.person.profilePictureUrl ? (
                      <img
                        src={personModal.person.profilePictureUrl}
                        alt={personModal.person.name}
                      />
                    ) : (
                      <span className="movie-person-placeholder">👤</span>
                    )}
                  </div>
                  <h2 id="person-modal-title" className="person-modal-name">
                    {personModal.person.name}
                  </h2>
                  {personModal.subtitle && (
                    <p className="person-modal-subtitle">{personModal.subtitle}</p>
                  )}
                  <dl className="person-modal-facts">
                    {personModal.person.nationality && (
                      <>
                        <dt>Nationality</dt>
                        <dd>{personModal.person.nationality}</dd>
                      </>
                    )}
                    {personModal.person.dateOfBirth && (
                      <>
                        <dt>Date of birth</dt>
                        <dd>{formatReleaseDate(personModal.person.dateOfBirth)}</dd>
                      </>
                    )}
                  </dl>
                  {personModal.person.bio && (
                    <div className="person-modal-bio">
                      <h3>Bio</h3>
                      <p>{personModal.person.bio}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {showCityPicker && (
          <div className="city-overlay">
            <div className="city-overlay-card">
              <AuthBackButton
                ariaLabel="Back"
                onClick={() => {
                  closeCityPicker();
                  setCitySearch("");
                }}
              />
              <h2>Select Your City</h2>
              <p className="step-subtitle">Choose a city to see showtimes near you</p>
              <input
                className="city-search"
                type="text"
                placeholder="Search city..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                autoFocus
              />
              <div className="city-overlay-grid">
                {cities
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                      c.state.toLowerCase().includes(citySearch.toLowerCase())
                  )
                  .map((city) => (
                      <div
                        key={city.id}
                        className={`city-pill ${selectedCity?.id === city.id ? "active" : ""}`}
                        onClick={() => {
                          handleCitySelect(city);
                          setCitySearch("");
                        }}
                      >
                        <span className="city-pill-icon">📍</span>
                        <div>
                          <strong>{city.name}</strong>
                          <span className="city-pill-meta">{city.state}</span>
                        </div>
                      </div>
                    ))}
                {cities.filter(
                  (c) =>
                    c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                    c.state.toLowerCase().includes(citySearch.toLowerCase())
                ).length === 0 && <div className="empty">No cities match &quot;{citySearch}&quot;</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page home-page">
      <div className="page-header">
        <h1>Now Showing</h1>
      </div>

      <div className={showCityPicker ? "movies-bg blurred" : "movies-bg home-movies-fill"}>
        {browseLoading ? (
          <div className="loading">Loading movies…</div>
        ) : selectedCity && browseRows.length === 0 ? (
          <div className="empty">
            No movies showing for your selection.
          </div>
        ) : !selectedCity ? (
          <div className="empty">No movies available yet.</div>
        ) : (
          <div className="movie-grid home-movie-grid">
            {browseRows.map((row) => {
              const movie = row.movie;
              return (
                <div
                  key={movie.id}
                  className="movie-card"
                  onClick={() => openMovieCard(movie)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openMovieCard(movie);
                    }
                  }}
                >
                  <div className="poster">
                    {movie.posterUrl ? (
                      <img src={movie.posterUrl} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      "🎬"
                    )}
                  </div>
                  <div className="info">
                    <h3>{movie.title}</h3>
                    <p>
                      {movie.genre} &middot; {movie.language}
                    </p>
                    <p>{formatRuntimeMinutes(movie.durationMinutes)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCityPicker && (
        <div className="city-overlay">
          <div className="city-overlay-card">
            <AuthBackButton
              ariaLabel="Back"
              onClick={() => {
                closeCityPicker();
                setCitySearch("");
              }}
            />
            <h2>Select Your City</h2>
            <p className="step-subtitle">Choose a city to see showtimes near you</p>
            <input
              className="city-search"
              type="text"
              placeholder="Search city..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              autoFocus
            />
            <div className="city-overlay-grid">
              {cities
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                    c.state.toLowerCase().includes(citySearch.toLowerCase())
                )
                .map((city) => (
                    <div
                      key={city.id}
                      className={`city-pill ${selectedCity?.id === city.id ? "active" : ""}`}
                      onClick={() => {
                        handleCitySelect(city);
                        setCitySearch("");
                      }}
                    >
                      <span className="city-pill-icon">📍</span>
                      <div>
                        <strong>{city.name}</strong>
                        <span className="city-pill-meta">{city.state}</span>
                      </div>
                    </div>
                  ))}
              {cities.filter(
                (c) =>
                  c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                  c.state.toLowerCase().includes(citySearch.toLowerCase())
              ).length === 0 && <div className="empty">No cities match &quot;{citySearch}&quot;</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
