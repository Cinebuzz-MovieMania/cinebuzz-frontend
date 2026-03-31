import { useEffect, useState } from "react";
import API from "../../services/api";

const emptyForm = {
  name: "", bio: "", dateOfBirth: "", nationality: "",
  profilePictureUrl: "", profilePictureKey: "",
};

function AdminPersons() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchPersons = () => {
    API.get("/persons")
      .then((res) => setPersons(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPersons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name, bio: p.bio || "", dateOfBirth: p.dateOfBirth || "",
      nationality: p.nationality || "", profilePictureUrl: p.profilePictureUrl || "",
      profilePictureKey: "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const req = editing
      ? API.put(`/persons/${editing}`, form)
      : API.post("/persons", form);

    req
      .then(() => { setShowForm(false); fetchPersons(); })
      .catch((err) => alert(err.response?.data?.message || "Error saving person"));
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
      <div className="page-header">
        <h1>Persons</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Person</button>
      </div>

      <div className="table-container">
        {persons.length === 0 ? (
          <div className="empty">No persons found. Add one to get started.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Nationality</th>
                <th>Date of Birth</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((p) => (
                <tr key={p.id}>
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
              <div className="form-group">
                <label>Profile Picture URL</label>
                <input value={form.profilePictureUrl} onChange={(e) => set("profilePictureUrl", e.target.value)} />
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

export default AdminPersons;
