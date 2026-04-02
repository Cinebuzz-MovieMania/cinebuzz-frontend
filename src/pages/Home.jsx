import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import SeatLayout from "../components/SeatLayout";
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
  const [theatres, setTheatres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { selectedCity, showCityPicker, selectCity, openCityPicker } = useCity();
  const [citySearch, setCitySearch] = useState("");

  /** Movie user clicked (detail + booking); null = only grid */
  const [focusMovie, setFocusMovie] = useState(null);
  /** true = theatres / dates / showtimes; false with focusMovie = detail overlay */
  const [bookingOpen, setBookingOpen] = useState(false);
  const [castList, setCastList] = useState([]);
  const [castLoading, setCastLoading] = useState(false);

  const [selectedDateKey, setSelectedDateKey] = useState(() => getLocalDateKey(new Date()));
  const [viewingShowtime, setViewingShowtime] = useState(null);

  const sevenDays = buildSevenDaysFromToday();

  useEffect(() => {
    Promise.all([
      API.get("/cities"),
      API.get("/theatres"),
      API.get("/movies"),
      API.get("/showtimes"),
    ])
      .then(([citiesRes, theatresRes, moviesRes, showtimesRes]) => {
        setCities(citiesRes.data.data || []);
        setTheatres(theatresRes.data.data || []);
        setMovies(moviesRes.data.data || []);
        setShowtimes(showtimesRes.data.data || []);
      })
      .catch((err) => console.error("Error loading data", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!focusMovie?.id) {
      setCastList([]);
      return;
    }
    setCastLoading(true);
    API.get(`/movies/${focusMovie.id}/cast`)
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
    const r = location.state?.restoreHome;
    if (!r) {
      restoreHandledKeyRef.current = null;
      return;
    }
    if (!movies.length) return;
    if (r.viewingShowtimeId != null && !showtimes.length) return;
    const key = JSON.stringify(r);
    if (restoreHandledKeyRef.current === key) return;

    const movie = r.focusMovieId != null ? movies.find((m) => m.id === r.focusMovieId) : null;
    if (r.focusMovieId != null && !movie) {
      restoreHandledKeyRef.current = key;
      navigate("/", { replace: true, state: {} });
      return;
    }

    restoreHandledKeyRef.current = key;
    setFocusMovie(movie ?? null);
    setBookingOpen(!!r.bookingOpen && !!movie);
    if (r.selectedDateKey) setSelectedDateKey(r.selectedDateKey);
    if (r.viewingShowtimeId != null && showtimes.length) {
      const st = showtimes.find((s) => s.id === r.viewingShowtimeId);
      setViewingShowtime(st ?? null);
    } else {
      setViewingShowtime(null);
    }
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, movies, showtimes, location.pathname, navigate]);

  const cityTheatreNames = selectedCity
    ? theatres.filter((t) => t.cityId === selectedCity.id).map((t) => t.name)
    : [];

  const cityShowtimes = showtimes.filter((s) => cityTheatreNames.includes(s.theatreName));
  const cityMovieIds = [...new Set(cityShowtimes.map((s) => s.movieId))];
  const cityMovies = selectedCity ? movies.filter((m) => cityMovieIds.includes(m.id)) : movies;

  const movieShowtimesForSelectedDate =
    bookingOpen && focusMovie
      ? cityShowtimes.filter(
          (s) =>
            s.movieId === focusMovie.id &&
            getLocalDateKey(new Date(s.startTime)) === selectedDateKey
        )
      : [];

  const movieShowtimesByTheatre = movieShowtimesForSelectedDate.reduce((acc, s) => {
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
  };

  const startBooking = () => {
    setBookingOpen(true);
    setSelectedDateKey(getLocalDateKey(new Date()));
  };

  const backFromBooking = () => {
    setBookingOpen(false);
  };

  if (loading) return <div className="loading">Loading...</div>;

  // ── Booking: dates + theatres (after Book tickets) ───
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

        {theatreNames.length === 0 ? (
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
            theatres={theatres}
            onClose={() => setViewingShowtime(null)}
          />
        )}
      </div>
    );
  }

  // ── Full page: movie detail (before Book tickets) ───
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
                    <div key={a.id} className="movie-person-card">
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
                    </div>
                  ))}
                </div>
              </section>
            )}

            {crew.length > 0 && (
              <section className="movie-detail-section">
                <h2 className="movie-detail-section-title">Crew</h2>
                <div className="movie-detail-people-grid">
                  {crew.map((c) => (
                    <div key={c.id} className="movie-person-card">
                      <div className="movie-person-photo">
                        {c.profilePictureUrl ? (
                          <img src={c.profilePictureUrl} alt={c.personName} />
                        ) : (
                          <span className="movie-person-placeholder">👤</span>
                        )}
                      </div>
                      <p className="movie-person-name">{c.personName}</p>
                      <p className="movie-person-sub">{formatCrewRole(c.role)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {actors.length === 0 && crew.length === 0 && (
              <p className="movie-detail-empty">Cast and crew not listed yet.</p>
            )}
          </>
        )}

        {showCityPicker && (
          <div className="city-overlay">
            <div className="city-overlay-card">
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
                  .map((city) => {
                    const count = theatres.filter((t) => t.cityId === city.id).length;
                    return (
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
                          <span className="city-pill-meta">
                            {city.state} &middot; {count} {count === 1 ? "theatre" : "theatres"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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

  // ── Grid + city picker ───
  return (
    <div className="page home-page">
      <div className="page-header">
        <h1>Now Showing</h1>
      </div>

      <div className={showCityPicker ? "movies-bg blurred" : "movies-bg home-movies-fill"}>
        {cityMovies.length === 0 ? (
          <div className="empty">
            {selectedCity ? "No movies showing for your selection." : "No movies available yet."}
          </div>
        ) : (
          <div className="movie-grid home-movie-grid">
            {cityMovies.map((movie) => {
              const count = selectedCity ? cityShowtimes.filter((s) => s.movieId === movie.id).length : 0;
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
                    {selectedCity && count > 0 && (
                      <span className="movie-show-count">
                        {count} {count === 1 ? "show" : "shows"}
                      </span>
                    )}
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
                .map((city) => {
                  const count = theatres.filter((t) => t.cityId === city.id).length;
                  return (
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
                        <span className="city-pill-meta">
                          {city.state} &middot; {count} {count === 1 ? "theatre" : "theatres"}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
