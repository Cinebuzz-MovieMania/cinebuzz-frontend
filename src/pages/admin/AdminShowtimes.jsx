import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import { formatRuntimeMinutes } from "../../utils/formatRuntime";
import SeatLayout from "../../components/SeatLayout";

const emptyForm = { movieId: "", screenId: "", startTime: "", price: "" };

function formatEndPreview(startLocal, durationMinutes) {
  if (!startLocal || durationMinutes == null) return null;
  const d = new Date(startLocal);
  if (Number.isNaN(d.getTime())) return null;
  d.setMinutes(d.getMinutes() + Number(durationMinutes));
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/** Local calendar date YYYY-MM-DD for filtering (matches browser date input). */
function localDateKeyFromIso(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function AdminShowtimes() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedTheatre, setSelectedTheatre] = useState("");
  const [viewingShowtime, setViewingShowtime] = useState(null);
  const [filterTitleInput, setFilterTitleInput] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterTheatreId, setFilterTheatreId] = useState("");
  const [filterScreenId, setFilterScreenId] = useState("");
  const [filterScreens, setFilterScreens] = useState([]);
  const [filterDate, setFilterDate] = useState("");

  const applyTitleFilter = () => setFilterTitle(filterTitleInput.trim());

  const filteredShowtimes = useMemo(() => {
    const q = filterTitle.toLowerCase();
    return showtimes.filter((s) => {
      const titleOk = !q || (s.movieTitle || "").toLowerCase().includes(q);
      const theatreOk = !filterTheatreId
        || (s.theatreName === theatres.find((t) => String(t.id) === filterTheatreId)?.name);
      const screenOk = !filterScreenId || String(s.screenId) === filterScreenId;
      const dateOk = !filterDate || localDateKeyFromIso(s.startTime) === filterDate;
      return titleOk && theatreOk && screenOk && dateOk;
    });
  }, [showtimes, filterTitle, filterTheatreId, filterScreenId, filterDate, theatres]);

  const fetchShowtimes = () => {
    API.get("/showtimes")
      .then((res) => setShowtimes(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchMovies = () => {
    API.get("/movies")
      .then((res) => setMovies(res.data.data || []))
      .catch((err) => console.error(err));
  };

  const fetchTheatres = () => {
    API.get("/theatres")
      .then((res) => setTheatres(res.data.data || []))
      .catch((err) => console.error(err));
  };

  const fetchScreens = (theatreId) => {
    if (!theatreId) { setScreens([]); return; }
    API.get(`/screens/theatre/${theatreId}`)
      .then((res) => setScreens(res.data.data || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => { fetchShowtimes(); fetchMovies(); fetchTheatres(); }, []);
  useEffect(() => { fetchScreens(selectedTheatre); }, [selectedTheatre]);

  useEffect(() => {
    if (!filterTheatreId) {
      setFilterScreens([]);
      setFilterScreenId("");
      return;
    }
    API.get(`/screens/theatre/${filterTheatreId}`)
      .then((res) => setFilterScreens(res.data.data || []))
      .catch((err) => {
        console.error(err);
        setFilterScreens([]);
      });
    setFilterScreenId("");
  }, [filterTheatreId]);

  const openCreate = () => {
    setForm(emptyForm);
    setSelectedTheatre("");
    setScreens([]);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const startIso = form.startTime && form.startTime.length === 16
      ? `${form.startTime}:00`
      : form.startTime;
    const payload = {
      movieId: Number(form.movieId),
      screenId: Number(form.screenId),
      startTime: startIso,
      price: Number(form.price),
    };

    API.post("/showtimes", payload)
      .then(() => { setShowForm(false); fetchShowtimes(); })
      .catch((err) => alert(err.response?.data?.message || "Error creating showtime"));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this showtime?")) return;
    API.delete(`/showtimes/${id}`)
      .then(() => fetchShowtimes())
      .catch((err) => alert(err.response?.data?.message || "Error deleting showtime"));
  };

  const set = (field, value) => setForm({ ...form, [field]: value });

  const selectedMovie = movies.find((m) => m.id === Number(form.movieId));
  const startForPreview = form.startTime && form.startTime.length === 16 ? `${form.startTime}:00` : form.startTime;
  const endPreview = formatEndPreview(startForPreview, selectedMovie?.durationMinutes);

  const formatDateTime = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("en-IN", {
      dateStyle: "medium", timeStyle: "short",
    });
  };

  if (loading) return <div className="loading">Loading showtimes...</div>;

  const hasActiveFilters = Boolean(filterTitle || filterTheatreId || filterScreenId || filterDate);
  const clearFilters = () => {
    setFilterTitleInput("");
    setFilterTitle("");
    setFilterTheatreId("");
    setFilterScreenId("");
    setFilterScreens([]);
    setFilterDate("");
  };

  return (
    <div className="page">
      <div className="admin-showtimes-head">
        <div className="admin-showtimes-title-row">
          <h1>Showtimes</h1>
          <button className="btn btn-primary" type="button" onClick={openCreate}>+ Add Showtime</button>
        </div>
        <div className="admin-showtimes-filters-panel" role="search" aria-label="Filter showtimes">
          <div className="admin-search-bar admin-showtimes-filter-search">
            <input
              type="search"
              className="admin-search-input"
              placeholder="Filter by movie title…"
              value={filterTitleInput}
              onChange={(e) => setFilterTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyTitleFilter();
                }
              }}
              aria-label="Filter by movie title"
            />
            <button className="btn btn-secondary btn-sm" type="button" onClick={applyTitleFilter}>
              Search
            </button>
          </div>
          <label className="admin-showtimes-theatre-filter">
            <span className="admin-showtimes-filter-label">Theatre</span>
            <select
              className="admin-filter-select"
              value={filterTheatreId}
              onChange={(e) => setFilterTheatreId(e.target.value)}
              aria-label="Filter by theatre"
            >
              <option value="">All theatres</option>
              {theatres.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.cityName ? ` (${t.cityName})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-showtimes-screen-filter">
            <span className="admin-showtimes-filter-label">Screen</span>
            <select
              className="admin-filter-select"
              value={filterScreenId}
              onChange={(e) => setFilterScreenId(e.target.value)}
              disabled={!filterTheatreId}
              aria-label="Filter by screen"
            >
              <option value="">{filterTheatreId ? "All screens" : "Select a theatre first"}</option>
              {filterScreens.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}{sc.totalSeats != null ? ` (${sc.totalSeats} seats)` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-showtimes-date-filter">
            <span className="admin-showtimes-filter-label">Show date</span>
            <div className="admin-showtimes-date-row">
              <input
                type="date"
                className="admin-filter-date-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                aria-label="Filter by show date"
              />
              {filterDate && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFilterDate("")}>
                  Any date
                </button>
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="table-container">
        {showtimes.length === 0 ? (
          <div className="empty">No showtimes found. Add one to get started.</div>
        ) : filteredShowtimes.length === 0 ? (
          <div className="empty">
            <p>No showtimes match your filters.</p>
            {hasActiveFilters && (
              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Movie</th>
                <th>Theatre</th>
                <th>Screen</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Price</th>
                <th>Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShowtimes.map((s) => (
                <tr key={s.id} onClick={() => setViewingShowtime(s)} style={{ cursor: "pointer" }}>
                  <td>{s.id}</td>
                  <td>{s.movieTitle}</td>
                  <td>{s.theatreName}</td>
                  <td>{s.screenName}</td>
                  <td>{formatDateTime(s.startTime)}</td>
                  <td>{formatDateTime(s.endTime)}</td>
                  <td>&#8377;{s.price}</td>
                  <td>{s.availableSeats}/{s.totalSeats}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setViewingShowtime(s); }}>View Seats</button>
                      <button className="btn btn-sm btn-danger" onClick={(e) => handleDelete(s.id, e)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewingShowtime && (
        <SeatLayout
          showtime={viewingShowtime}
          theatres={theatres}
          onClose={() => setViewingShowtime(null)}
        />
      )}

      {showForm && (
        <div className="form-overlay" onClick={() => setShowForm(false)}>
          <div className="form-card" onClick={(e) => e.stopPropagation()}>
            <h2>Add Showtime</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Movie</label>
                <select value={form.movieId} onChange={(e) => set("movieId", e.target.value)} required>
                  <option value="">Select a movie</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Theatre</label>
                <select value={selectedTheatre} onChange={(e) => { setSelectedTheatre(e.target.value); set("screenId", ""); }} required>
                  <option value="">Select a theatre</option>
                  {theatres.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.cityName})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Screen</label>
                <select value={form.screenId} onChange={(e) => set("screenId", e.target.value)} required>
                  <option value="">Select a screen</option>
                  {screens.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.totalSeats} seats)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} required />
                <p className="form-hint">End time is set automatically from the movie length. A minimum 5-minute gap is required between shows on the same screen.</p>
              </div>
              {selectedMovie && form.startTime && endPreview && (
                <div className="form-group computed-end-preview">
                  <label>Computed end time</label>
                  <p className="computed-end-value">{endPreview} ({formatRuntimeMinutes(selectedMovie.durationMinutes)})</p>
                </div>
              )}
              <div className="form-group">
                <label>Price (&#8377;)</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">Create</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminShowtimes;
