import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import { formatRuntimeMinutes } from "../../utils/formatRuntime";

const ROLES = ["ACTOR", "DIRECTOR", "PRODUCER", "WRITER", "CINEMATOGRAPHER"];
const emptyCastForm = { personId: "", role: "", characterName: "", billingOrder: "" };

function MovieDetailPanel({ movie, persons, onMovieUpdate }) {
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
    <div className="admin-movie-detail-panel">
      <div className="movie-detail-header">
        <div className="movie-detail-poster">
          <div className="movie-detail-poster-frame">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} />
            ) : (
              <span className="movie-detail-poster-placeholder" aria-hidden>🎬</span>
            )}
          </div>
          <div className="poster-actions">
            <input type="file" accept="image/*" ref={posterInputRef} onChange={handlePosterUpload} style={{ display: "none" }} />
            <button type="button" className="btn btn-sm btn-primary" onClick={() => posterInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading..." : movie.posterUrl ? "Change" : "Upload"}
            </button>
            {movie.posterUrl && (
              <button type="button" className="btn btn-sm btn-danger" onClick={handlePosterRemove}>Remove</button>
            )}
          </div>
        </div>
        <div className="movie-detail-info">
          <h2>{movie.title}</h2>
          <p className="movie-detail-meta">{movie.genre} &middot; {movie.language} &middot; {formatRuntimeMinutes(movie.durationMinutes)}</p>
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
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowCastForm(true)}>+ Add</button>
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
                        <button type="button" className="cast-remove" onClick={() => handleRemoveCast(a.personId)} title="Remove">&times;</button>
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
                        <button type="button" className="cast-remove" onClick={() => handleRemoveCast(c.personId)} title="Remove">&times;</button>
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

function AdminMovieDetail() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const id = parseInt(movieId, 10);

  const [movie, setMovie] = useState(null);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id) || id < 1) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    API.get(`/movies/${id}`)
      .then((res) => setMovie(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    API.get("/persons")
      .then((res) => setPersons(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  if (loading) {
    return (
      <div className="page admin-movie-detail-page">
        <div className="loading">Loading movie...</div>
      </div>
    );
  }

  if (notFound || !movie) {
    return (
      <div className="page admin-movie-detail-page">
        <div className="admin-movies-empty">
          <p>Movie not found.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/admin/movies")}>
            Back to movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page admin-movie-detail-page">
      <div className="admin-movie-detail-toolbar">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate("/admin/movies")}>
          ← Back to movies
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => navigate("/admin/movies", { state: { editMovieId: movie.id } })}
        >
          Edit movie
        </button>
      </div>
      <MovieDetailPanel
        movie={movie}
        persons={persons}
        onMovieUpdate={(updated) => setMovie(updated)}
      />
    </div>
  );
}

export default AdminMovieDetail;
