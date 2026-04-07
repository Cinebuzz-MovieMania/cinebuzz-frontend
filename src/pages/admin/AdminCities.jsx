import { useEffect, useState } from "react";
import API from "../../services/api";

const emptyForm = { name: "", state: "" };

function AdminCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCities = () => {
    API.get("/cities")
      .then((res) => setCities(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCities(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (city) => {
    setEditing(city.id);
    setForm({ name: city.name, state: city.state });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const req = editing
      ? API.put(`/cities/${editing}`, form)
      : API.post("/cities", form);

    req
      .then(() => { setShowForm(false); fetchCities(); })
      .catch((err) => alert(err.response?.data?.message || "Error saving city"));
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this city?")) return;
    API.delete(`/cities/${id}`)
      .then(() => fetchCities())
      .catch((err) => alert(err.response?.data?.message || "Error deleting city"));
  };

  if (loading) return <div className="loading">Loading cities...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Cities</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add City</button>
      </div>

      <div className="table-container">
        {cities.length === 0 ? (
          <div className="empty">No cities found. Add one to get started.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.state}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-primary" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
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
            <h2>{editing ? "Edit City" : "Add City"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>City Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
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

export default AdminCities;
  