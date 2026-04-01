import { useEffect, useState } from "react";
import API from "../services/api";
import SeatLayout from "../components/SeatLayout";
import { useCity } from "../context/CityContext";

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
  const [cities, setCities] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { selectedCity, showCityPicker, selectCity, openCityPicker } = useCity();
  const [citySearch, setCitySearch] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
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

  const cityTheatreNames = selectedCity
    ? theatres.filter((t) => t.cityId === selectedCity.id).map((t) => t.name)
    : [];

  const cityShowtimes = showtimes.filter((s) => cityTheatreNames.includes(s.theatreName));
  const cityMovieIds = [...new Set(cityShowtimes.map((s) => s.movieId))];
  const cityMovies = selectedCity ? movies.filter((m) => cityMovieIds.includes(m.id)) : movies;

  const movieShowtimesForSelectedDate = selectedMovie
    ? cityShowtimes.filter(
        (s) =>
          s.movieId === selectedMovie.id &&
          getLocalDateKey(new Date(s.startTime)) === selectedDateKey
      )
    : [];

  const movieShowtimesByTheatre = movieShowtimesForSelectedDate.reduce((acc, s) => {
    if (!acc[s.theatreName]) acc[s.theatreName] = [];
    acc[s.theatreName].push(s);
    return acc;
  }, {});

  Object.keys(movieShowtimesByTheatre).forEach((name) => {
    movieShowtimesByTheatre[name].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );
  });

  const formatTime = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  const formatTimeOnly = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const handleCitySelect = (city) => {
    selectCity(city);
    setSelectedMovie(null);
  };

  const handleChangeCity = () => {
    openCityPicker();
    setSelectedMovie(null);
  };

  const openMovie = (movie) => {
    setSelectedMovie(movie);
    setSelectedDateKey(getLocalDateKey(new Date()));
  };

  if (loading) return <div className="loading">Loading...</div>;

  // ── Step 3: Theatres & Showtimes for Selected Movie ───
  if (selectedMovie) {
    const theatreNames = Object.keys(movieShowtimesByTheatre).sort((a, b) => a.localeCompare(b));

    return (
      <div className="page">
        <div className="step-header">
          <button className="back-btn" onClick={() => setSelectedMovie(null)}>&larr; Back to Movies</button>
        </div>

        <div className="selected-movie-banner">
          <div className="banner-poster">
            {selectedMovie.posterUrl ? (
              <img src={selectedMovie.posterUrl} alt={selectedMovie.title} />
            ) : (
              <span className="poster-placeholder">🎬</span>
            )}
          </div>
          <div className="banner-info">
            <h1>{selectedMovie.title}</h1>
            <p className="banner-meta">{selectedMovie.genre} &middot; {selectedMovie.language} &middot; {selectedMovie.durationMinutes} min</p>
            {selectedMovie.description && <p className="banner-desc">{selectedMovie.description}</p>}
            {selectedCity && <p className="banner-city">📍 {selectedCity.name}, {selectedCity.state}</p>}
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
          Shows on {new Date(selectedDateKey + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          <span className="shows-theatre-count">
            {theatreNames.length} {theatreNames.length === 1 ? "theatre" : "theatres"}
          </span>
        </h2>

        {theatreNames.length === 0 ? (
          <div className="empty date-empty">No shows for this movie on this date in {selectedCity?.name || "this city"}.</div>
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
                      >
                        <span className="showtime-mini-time">{formatTimeOnly(s.startTime)}</span>
                        <span className="showtime-mini-screen">{s.screenName}</span>
                        <span className="showtime-mini-price">&#8377;{s.price}</span>
                        <span className="showtime-mini-seats">{s.availableSeats} seats</span>
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

  // ── Movies Grid (always visible) + City Picker Overlay ───
  return (
    <div className="page">
      <div className="page-header">
        <h1>Now Showing</h1>
        {selectedCity ? (
          <button className="city-selected-btn" onClick={handleChangeCity}>
            📍 {selectedCity.name} &middot; Change
          </button>
        ) : (
          <button className="city-selected-btn" onClick={() => openCityPicker()}>
            📍 Select City
          </button>
        )}
      </div>

      <div className={showCityPicker ? "movies-bg blurred" : "movies-bg"}>
        {cityMovies.length === 0 ? (
          <div className="empty">{selectedCity ? `No movies showing in ${selectedCity.name}.` : "No movies available yet."}</div>
        ) : (
          <div className="movie-grid">
            {cityMovies.map((movie) => {
              const count = selectedCity ? cityShowtimes.filter((s) => s.movieId === movie.id).length : 0;
              return (
                <div key={movie.id} className="movie-card" onClick={() => { if (!showCityPicker) openMovie(movie); }}>
                  <div className="poster">
                    {movie.posterUrl ? (
                      <img src={movie.posterUrl} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      "🎬"
                    )}
                  </div>
                  <div className="info">
                    <h3>{movie.title}</h3>
                    <p>{movie.genre} &middot; {movie.language}</p>
                    <p>{movie.durationMinutes} min</p>
                    {selectedCity && count > 0 && (
                      <span className="movie-show-count">{count} {count === 1 ? "show" : "shows"}</span>
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
                .filter((c) =>
                  c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                  c.state.toLowerCase().includes(citySearch.toLowerCase())
                )
                .map((city) => {
                  const count = theatres.filter((t) => t.cityId === city.id).length;
                  return (
                    <div
                      key={city.id}
                      className={`city-pill ${selectedCity?.id === city.id ? "active" : ""}`}
                      onClick={() => { handleCitySelect(city); setCitySearch(""); }}
                    >
                      <span className="city-pill-icon">📍</span>
                      <div>
                        <strong>{city.name}</strong>
                        <span className="city-pill-meta">{city.state} &middot; {count} {count === 1 ? "theatre" : "theatres"}</span>
                      </div>
                    </div>
                  );
                })}
              {cities.filter((c) =>
                c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                c.state.toLowerCase().includes(citySearch.toLowerCase())
              ).length === 0 && (
                <div className="empty">No cities match "{citySearch}"</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
