import { useEffect, useState } from "react";
import API from "../../services/api";

const emptyForm = { name: "", address: "", cityId: "" };

function AdminTheatres() {
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchTheatres = () => {
    API.get("/theatres")
      .then((res) => setTheatres(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchCities = () => {
    API.get("/cities")
      .then((res) => setCities(res.data.data || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => { fetchTheatres(); fetchCities(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditing(t.id);
    setForm({ name: t.name, address: t.address, cityId: t.cityId });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, cityId: Number(form.cityId) };
    const req = editing
      ? API.put(`/theatres/${editing}`, payload)
      : API.post("/theatres", payload);

    req
      .then(() => { setShowForm(false); fetchTheatres(); })
      .catch((err) => alert(err.response?.data?.message || "Error saving theatre"));
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this theatre?")) return;
    API.delete(`/theatres/${id}`)
      .then(() => fetchTheatres())
      .catch((err) => alert(err.response?.data?.message || "Error deleting theatre"));
  };

  const set = (field, value) => setForm({ ...form, [field]: value });

  if (loading) return <div className="loading">Loading theatres...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Theatres</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Theatre</button>
      </div>

      <div className="table-container">
        {theatres.length === 0 ? (
          <div className="empty">No theatres found. Add one to get started.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Address</th>
                <th>City</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {theatres.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{t.address}</td>
                  <td>{t.cityName}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-primary" onClick={() => openEdit(t)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Delete</button>
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
            <h2>{editing ? "Edit Theatre" : "Add Theatre"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Theatre Name</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea value={form.address} onChange={(e) => set("address", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>City</label>
                <select value={form.cityId} onChange={(e) => set("cityId", e.target.value)} required>
                  <option value="">Select a city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}, {c.state}</option>
                  ))}
                </select>
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

export default AdminTheatres;
