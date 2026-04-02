import { useEffect, useState } from "react";
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Showtimes</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Showtime</button>
      </div>

      <div className="table-container">
        {showtimes.length === 0 ? (
          <div className="empty">No showtimes found. Add one to get started.</div>
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
              {showtimes.map((s) => (
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
