import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { formatRuntimeMinutes } from "../../utils/formatRuntime";

const emptyForm = {
  title: "", description: "", genre: "", language: "",
  durationMinutes: "", releaseDate: "", posterUrl: "", posterKey: "",
};

function movieMatchesSearch(m, q) {
  const t = (q || "").trim().toLowerCase();
  if (!t) return true;
  const hay = [
    m.title,
    m.genre,
    m.language,
    m.description,
    m.releaseDate != null ? String(m.releaseDate) : "",
    m.durationMinutes != null ? String(m.durationMinutes) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(t);
}

function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const applySearch = () => setSearchQuery(searchInput.trim());

  const filteredMovies = useMemo(
    () => movies.filter((m) => movieMatchesSearch(m, searchQuery)),
    [movies, searchQuery],
  );

  const fetchMovies = () => {
    API.get("/movies")
      .then((res) => setMovies(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMovies(); }, []);

  useEffect(() => {
    const editId = location.state?.editMovieId;
    if (!editId || !movies.length) return;
    const m = movies.find((x) => x.id === editId);
    if (!m) return;
    setEditing(m.id);
    setForm({
      title: m.title,
      description: m.description || "",
      genre: m.genre,
      language: m.language,
      durationMinutes: m.durationMinutes,
      releaseDate: m.releaseDate,
      posterUrl: m.posterUrl || "",
      posterKey: "",
    });
    setShowForm(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, movies, location.pathname, navigate]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (m, e) => {
    e.stopPropagation();
    setEditing(m.id);
    setForm({
      title: m.title, description: m.description || "", genre: m.genre,
      language: m.language, durationMinutes: m.durationMinutes,
      releaseDate: m.releaseDate, posterUrl: m.posterUrl || "", posterKey: "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, durationMinutes: Number(form.durationMinutes) };
    const req = editing
      ? API.put(`/movies/${editing}`, payload)
      : API.post("/movies", payload);

    req
      .then(() => { setShowForm(false); fetchMovies(); })
      .catch((err) => alert(err.response?.data?.message || "Error saving movie"));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this movie?")) return;
    API.delete(`/movies/${id}`)
      .then(() => fetchMovies())
      .catch((err) => alert(err.response?.data?.message || "Error deleting movie"));
  };

  const set = (field, value) => setForm({ ...form, [field]: value });

  if (loading) {
    return (
      <div className="page admin-movies-page">
        <div className="loading">Loading movies...</div>
      </div>
    );
  }

  return (
    <div className="page admin-movies-page">
      <div className="admin-movies-toolbar">
        <h2 className="admin-movies-title">Movies</h2>
        <div className="admin-search-bar">
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search by title, genre, language…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applySearch();
              }
            }}
            aria-label="Search movies"
          />
          <button className="btn btn-secondary btn-sm" type="button" onClick={applySearch}>
            Search
          </button>
        </div>
        <button className="btn btn-primary btn-sm" type="button" onClick={openCreate}>+ Add</button>
      </div>

      {movies.length === 0 ? (
        <div className="admin-movies-empty">No movies found.</div>
      ) : filteredMovies.length === 0 ? (
        <div className="admin-movies-empty">
          <p>No movies match &ldquo;{searchQuery}&rdquo;.</p>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => { setSearchInput(""); setSearchQuery(""); }}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="admin-movies-list">
          {filteredMovies.map((m) => (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              className="list-item list-item-full admin-movie-row"
              onClick={() => navigate(`/admin/movies/${m.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/admin/movies/${m.id}`);
                }
              }}
            >
              <div className="list-item-poster">
                {m.posterUrl ? (
                  <img src={m.posterUrl} alt="" />
                ) : (
                  <span className="list-item-poster-placeholder" aria-hidden>🎬</span>
                )}
              </div>
              <div className="admin-movie-row-title">
                <strong className="admin-movie-row-title-text">{m.title}</strong>
              </div>
              <div className="admin-movie-row-details">
                <div className="admin-movie-detail-cell">
                  <span className="admin-movie-detail-label">Genre</span>
                  <span className="admin-movie-detail-value">{m.genre || "—"}</span>
                </div>
                <div className="admin-movie-detail-cell">
                  <span className="admin-movie-detail-label">Language</span>
                  <span className="admin-movie-detail-value">{m.language || "—"}</span>
                </div>
                <div className="admin-movie-detail-cell">
                  <span className="admin-movie-detail-label">Duration</span>
                  <span className="admin-movie-detail-value">{formatRuntimeMinutes(m.durationMinutes)}</span>
                </div>
                <div className="admin-movie-detail-cell">
                  <span className="admin-movie-detail-label">Release</span>
                  <span className="admin-movie-detail-value">{m.releaseDate || "—"}</span>
                </div>
              </div>
              <div className="list-item-actions">
                <button type="button" className="btn btn-sm btn-primary" onClick={(e) => openEdit(m, e)}>Edit</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={(e) => handleDelete(m.id, e)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="form-overlay" onClick={() => setShowForm(false)}>
          <div className="form-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Edit Movie" : "Add Movie"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Genre</label>
                <input value={form.genre} onChange={(e) => set("genre", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Language</label>
                <input value={form.language} onChange={(e) => set("language", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input type="number" min="1" value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Release Date</label>
                <input type="date" value={form.releaseDate} onChange={(e) => set("releaseDate", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Poster</label>
                <p className="form-hint">You can upload a poster after creating the movie.</p>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">{editing ? "Update" : "Create"}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMovies;
