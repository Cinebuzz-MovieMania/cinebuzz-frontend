import { useEffect, useState, useRef } from "react";
import API from "../../services/api";

const emptyForm = {
  title: "", description: "", genre: "", language: "",
  durationMinutes: "", releaseDate: "", posterUrl: "", posterKey: "",
};

const ROLES = ["ACTOR", "DIRECTOR", "PRODUCER", "WRITER", "CINEMATOGRAPHER"];
const emptyCastForm = { personId: "", role: "", characterName: "", billingOrder: "" };

function MovieDetail({ movie, persons, onMovieUpdate }) {
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCastForm, setShowCastForm] = useState(false);
  const [castForm, setCastForm] = useState(emptyCastForm);
  const [uploading, setUploading] = useState(false);
  const posterInputRef = useRef(null);

  const fetchCast = () => {
    setLoading(true);
    API.get(`/movies/${movie.id}/cast`)
      .then((res) => setCast(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCast(); }, [movie.id]);

  const actors = cast.filter((c) => c.role === "ACTOR");
  const crew = cast.filter((c) => c.role !== "ACTOR");

  const handlePosterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    API.post(`/movies/${movie.id}/poster`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then((res) => { if (onMovieUpdate) onMovieUpdate(res.data.data); })
      .catch((err) => alert(err.response?.data?.message || "Upload failed"))
      .finally(() => setUploading(false));
  };

  const handlePosterRemove = () => {
    if (!confirm("Remove this poster?")) return;
    API.delete(`/movies/${movie.id}/poster`)
      .then((res) => { if (onMovieUpdate) onMovieUpdate(res.data.data); })
      .catch((err) => alert(err.response?.data?.message || "Remove failed"));
  };

  const handleAddCast = (e) => {
    e.preventDefault();
    const payload = {
      personId: Number(castForm.personId),
      role: castForm.role,
      characterName: castForm.characterName || null,
      billingOrder: castForm.billingOrder ? Number(castForm.billingOrder) : null,
    };
    API.post(`/movies/${movie.id}/cast`, payload)
      .then(() => { setShowCastForm(false); setCastForm(emptyCastForm); fetchCast(); })
      .catch((err) => alert(err.response?.data?.message || "Error adding cast"));
  };

  const handleRemoveCast = (personId) => {
    if (!confirm("Remove this person from the movie?")) return;
    API.delete(`/movies/${movie.id}/cast/${personId}`)
      .then(() => fetchCast())
      .catch((err) => alert(err.response?.data?.message || "Error removing cast"));
  };

  const setCF = (field, value) => setCastForm({ ...castForm, [field]: value });

  return (
    <div className="detail-panel">
      <div className="movie-detail-header">
        <div className="movie-detail-poster">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.title} />
          ) : (
            <span className="poster-placeholder">🎬</span>
          )}
          <div className="poster-actions">
            <input type="file" accept="image/*" ref={posterInputRef} onChange={handlePosterUpload} style={{ display: "none" }} />
            <button className="btn btn-sm btn-primary" onClick={() => posterInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading..." : movie.posterUrl ? "Change" : "Upload"}
            </button>
            {movie.posterUrl && (
              <button className="btn btn-sm btn-danger" onClick={handlePosterRemove}>Remove</button>
            )}
          </div>
        </div>
        <div className="movie-detail-info">
          <h2>{movie.title}</h2>
          <p className="movie-detail-meta">{movie.genre} &middot; {movie.language} &middot; {movie.durationMinutes} min</p>
          <p className="movie-detail-meta">Released: {movie.releaseDate}</p>
          {movie.description && <p className="movie-detail-desc">{movie.description}</p>}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading cast &amp; crew...</div>
      ) : (
        <div className="cast-crew-section">
          <div className="cast-crew-header">
            <h3>Cast &amp; Crew</h3>
            <button className="btn btn-sm btn-primary" onClick={() => setShowCastForm(true)}>+ Add</button>
          </div>

          {cast.length === 0 ? (
            <p className="cast-empty">No cast or crew added yet.</p>
          ) : (
            <>
              {actors.length > 0 && (
                <div className="cast-group">
                  <h4>Cast</h4>
                  <div className="cast-grid">
                    {actors.map((a) => (
                      <div key={a.id} className="cast-card">
                        <div className="cast-avatar">
                          {a.profilePictureUrl ? <img src={a.profilePictureUrl} alt={a.personName} /> : <span>👤</span>}
                        </div>
                        <div className="cast-info">
                          <strong>{a.personName}</strong>
                          {a.characterName && <span className="cast-character">as {a.characterName}</span>}
                        </div>
                        <button className="cast-remove" onClick={() => handleRemoveCast(a.personId)} title="Remove">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {crew.length > 0 && (
                <div className="cast-group">
                  <h4>Crew</h4>
                  <div className="cast-grid">
                    {crew.map((c) => (
                      <div key={c.id} className="cast-card">
                        <div className="cast-avatar">
                          {c.profilePictureUrl ? <img src={c.profilePictureUrl} alt={c.personName} /> : <span>👤</span>}
                        </div>
                        <div className="cast-info">
                          <strong>{c.personName}</strong>
                          <span className="cast-role">{c.role}</span>
                        </div>
                        <button className="cast-remove" onClick={() => handleRemoveCast(c.personId)} title="Remove">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showCastForm && (
        <div className="cast-form-inline">
          <h4>Add Cast / Crew</h4>
          <form onSubmit={handleAddCast}>
            <div className="cast-form-row">
              <div className="form-group">
                <label>Person</label>
                <select value={castForm.personId} onChange={(e) => setCF("personId", e.target.value)} required>
                  <option value="">Select person</option>
                  {persons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={castForm.role} onChange={(e) => setCF("role", e.target.value)} required>
                  <option value="">Select role</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="cast-form-row">
              <div className="form-group">
                <label>Character Name</label>
                <input value={castForm.characterName} onChange={(e) => setCF("characterName", e.target.value)} placeholder="e.g. Dom Cobb (for actors)" />
              </div>
              <div className="form-group">
                <label>Billing Order</label>
                <input type="number" min="1" value={castForm.billingOrder} onChange={(e) => setCF("billingOrder", e.target.value)} placeholder="e.g. 1" />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-success btn-sm">Add</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCastForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewingMovie, setViewingMovie] = useState(null);

  const fetchMovies = () => {
    API.get("/movies")
      .then((res) => setMovies(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchPersons = () => {
    API.get("/persons")
      .then((res) => setPersons(res.data.data || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => { fetchMovies(); fetchPersons(); }, []);

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
      .then(() => {
        fetchMovies();
        if (viewingMovie?.id === id) setViewingMovie(null);
      })
      .catch((err) => alert(err.response?.data?.message || "Error deleting movie"));
  };

  const set = (field, value) => setForm({ ...form, [field]: value });

  if (loading) return <div className="loading">Loading movies...</div>;

  return (
    <div className="page split-layout">
      <div className="list-panel">
        <div className="list-panel-header">
          <h2>Movies</h2>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add</button>
        </div>

        {movies.length === 0 ? (
          <div className="empty">No movies found.</div>
        ) : (
          <div className="list-panel-items">
            {movies.map((m) => (
              <div
                key={m.id}
                className={`list-item ${viewingMovie?.id === m.id ? "active" : ""}`}
                onClick={() => setViewingMovie(m)}
              >
                <div className="list-item-poster">
                  {m.posterUrl ? (
                    <img src={m.posterUrl} alt={m.title} />
                  ) : (
                    <span>🎬</span>
                  )}
                </div>
                <div className="list-item-info">
                  <strong>{m.title}</strong>
                  <span className="list-item-meta">{m.genre} &middot; {m.language}</span>
                  <span className="list-item-meta">{m.durationMinutes} min &middot; {m.releaseDate}</span>
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-sm btn-primary" onClick={(e) => openEdit(m, e)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={(e) => handleDelete(m.id, e)}>Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingMovie ? (
        <MovieDetail
          movie={viewingMovie}
          persons={persons}
          onMovieUpdate={(updated) => {
            setViewingMovie(updated);
            setMovies((prev) => prev.map((m) => m.id === updated.id ? updated : m));
          }}
        />
      ) : (
        <div className="detail-panel detail-empty">
          <p>Select a movie to view details</p>
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
