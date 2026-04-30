import { useEffect, useMemo, useState, useRef } from "react";
import API from "../../services/api";

const emptyForm = {
  name: "", bio: "", dateOfBirth: "", nationality: "",
};

function personMatchesSearch(p, q) {
  const t = (q || "").trim().toLowerCase();
  if (!t) return true;
  const hay = [
    p.name,
    p.nationality,
    p.bio,
    p.dateOfBirth != null ? String(p.dateOfBirth) : "",
    String(p.id),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(t);
}

function AdminPersons() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(null);
  const [pendingProfileFile, setPendingProfileFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const profileInputRef = useRef(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState(null);

  const applySearch = () => setSearchQuery(searchInput.trim());

  const filteredPersons = useMemo(
    () => persons.filter((p) => personMatchesSearch(p, searchQuery)),
    [persons, searchQuery],
  );

  const fetchPersons = () => {
    setLoadError(null);
    API.get("/persons")
      .then((res) => setPersons(res.data.data || []))
      .catch((err) => {
        console.error(err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          (err.response?.status === 401 || err.response?.status === 403
            ? "Not authorized to load persons. Sign in again or use an admin account."
            : "Could not load persons.");
        setLoadError(msg);
        setPersons([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPersons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setProfilePreviewUrl(null);
    setPendingProfileFile(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      bio: p.bio || "",
      dateOfBirth: p.dateOfBirth || "",
      nationality: p.nationality || "",
    });
    setProfilePreviewUrl(p.profilePictureUrl || null);
    setPendingProfileFile(null);
    setShowForm(true);
  };

  const buildPayload = () => ({
    name: form.name,
    bio: form.bio || null,
    dateOfBirth: form.dateOfBirth || null,
    nationality: form.nationality || null,
  });

  const uploadProfile = (personId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    return API.post(`/persons/${personId}/profile-picture`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then((res) => {
        const url = res.data.data?.profilePictureUrl;
        if (url) setProfilePreviewUrl(url);
      })
      .catch((err) => alert(err.response?.data?.message || "Upload failed"))
      .finally(() => setUploading(false));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = buildPayload();

    if (editing) {
      API.put(`/persons/${editing}`, payload)
        .then(() => {
          setShowForm(false);
          fetchPersons();
        })
        .catch((err) => alert(err.response?.data?.message || "Error saving person"));
      return;
    }

    API.post("/persons", payload)
      .then((res) => {
        const newId = res.data.data?.id;
        setShowForm(false);
        fetchPersons();
        if (pendingProfileFile && newId) {
          return uploadProfile(newId, pendingProfileFile).then(() => fetchPersons());
        }
      })
      .catch((err) => alert(err.response?.data?.message || "Error saving person"));
  };

  const handleProfileFilePick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (editing) {
      uploadProfile(editing, file).then(() => fetchPersons());
    } else {
      setPendingProfileFile(file);
      setProfilePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileRemove = () => {
    if (!editing) {
      setPendingProfileFile(null);
      setProfilePreviewUrl(null);
      return;
    }
    if (!confirm("Remove this profile photo?")) return;
    API.delete(`/persons/${editing}/profile-picture`)
      .then((res) => {
        setProfilePreviewUrl(res.data.data?.profilePictureUrl || null);
        fetchPersons();
      })
      .catch((err) => alert(err.response?.data?.message || "Remove failed"));
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this person?")) return;
    API.delete(`/persons/${id}`)
      .then(() => fetchPersons())
      .catch((err) => alert(err.response?.data?.message || "Error deleting person"));
  };

  const set = (field, value) => setForm({ ...form, [field]: value });

  if (loading) return <div className="loading">Loading persons...</div>;

  return (
    <div className="page">
      <div className="page-header page-header-with-search">
        <h1>Persons</h1>
        <div className="admin-search-bar">
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search by name, nationality, bio…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applySearch();
              }
            }}
            aria-label="Search persons"
          />
          <button className="btn btn-secondary btn-sm" type="button" onClick={applySearch}>
            Search
          </button>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>+ Add Person</button>
      </div>

      {loadError && (
        <div className="empty" style={{ marginBottom: 16, color: "#b91c1c" }}>
          {loadError}{" "}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setLoading(true);
              fetchPersons();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="table-container">
        {loadError ? null : persons.length === 0 ? (
          <div className="empty">No persons found. Add one to get started.</div>
        ) : filteredPersons.length === 0 ? (
          <div className="empty">
            <p>No persons match &ldquo;{searchQuery}&rdquo;.</p>
            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => { setSearchInput(""); setSearchQuery(""); }}>
              Clear search
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>ID</th>
                <th>Name</th>
                <th>Nationality</th>
                <th>Date of Birth</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersons.map((p) => (
                <tr key={p.id}>
                  <td className="cell-thumb">
                    {p.profilePictureUrl ? (
                      <img src={p.profilePictureUrl} alt="" className="person-thumb" />
                    ) : (
                      <span className="poster-placeholder">👤</span>
                    )}
                  </td>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.nationality || "—"}</td>
                  <td>{p.dateOfBirth || "—"}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-primary" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="form-overlay" onClick={() => setShowForm(false)}>
          <div className="form-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Edit Person" : "Add Person"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group person-profile-upload">
                <label>Profile photo</label>
                <p className="form-hint">
                  {editing
                    ? "Uploads are stored in cloud storage under person-profiles/."
                    : "After you create this person, the selected image will upload automatically. You can also add a photo later by editing."}
                </p>
                <div className="person-profile-row">
                  <div className="person-profile-preview">
                    {profilePreviewUrl ? (
                      <img src={profilePreviewUrl} alt="" />
                    ) : (
                      <span className="poster-placeholder">👤</span>
                    )}
                  </div>
                  <div className="person-profile-actions">
                    <input
                      type="file"
                      accept="image/*"
                      ref={profileInputRef}
                      onChange={handleProfileFilePick}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => profileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : profilePreviewUrl ? "Change photo" : "Choose photo"}
                    </button>
                    {profilePreviewUrl && (
                      <button type="button" className="btn btn-sm btn-danger" onClick={handleProfileRemove}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Nationality</label>
                <input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success" disabled={uploading}>
                  {editing ? "Update" : "Create"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPersons;
