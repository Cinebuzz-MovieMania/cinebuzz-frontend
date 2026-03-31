import { useEffect, useState } from "react";
import API from "../../services/api";

const emptyForm = { name: "", totalRows: "", seatsPerRow: "", theatreId: "" };

function AdminScreens() {
  const [screens, setScreens] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedTheatre, setSelectedTheatre] = useState("");

  const fetchTheatres = () => {
    API.get("/theatres")
      .then((res) => {
        const list = res.data.data || [];
        setTheatres(list);
        if (list.length > 0 && !selectedTheatre) {
          setSelectedTheatre(String(list[0].id));
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchScreens = (theatreId) => {
    if (!theatreId) { setScreens([]); setLoading(false); return; }
    setLoading(true);
    API.get(`/screens/theatre/${theatreId}`)
      .then((res) => setScreens(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTheatres(); }, []);
  useEffect(() => { if (selectedTheatre) fetchScreens(selectedTheatre); }, [selectedTheatre]);

  const openCreate = () => {
    setForm({ ...emptyForm, theatreId: selectedTheatre });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      totalRows: Number(form.totalRows),
      seatsPerRow: Number(form.seatsPerRow),
      theatreId: Number(form.theatreId),
    };

    API.post("/screens", payload)
      .then(() => { setShowForm(false); fetchScreens(selectedTheatre); })
      .catch((err) => alert(err.response?.data?.message || "Error creating screen"));
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this screen?")) return;
    API.delete(`/screens/${id}`)
      .then(() => fetchScreens(selectedTheatre))
      .catch((err) => alert(err.response?.data?.message || "Error deleting screen"));
  };

  const set = (field, value) => setForm({ ...form, [field]: value });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Screens</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Screen</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Filter by Theatre:</label>
        <select
          value={selectedTheatre}
          onChange={(e) => setSelectedTheatre(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 6, border: "1.5px solid #dee2e6", fontSize: 14 }}
        >
          <option value="">Select a theatre</option>
          {theatres.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.cityName})</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading screens...</div>
        ) : screens.length === 0 ? (
          <div className="empty">No screens found for this theatre.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Rows</th>
                <th>Seats/Row</th>
                <th>Total Seats</th>
                <th>Theatre</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {screens.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.totalRows}</td>
                  <td>{s.seatsPerRow}</td>
                  <td>{s.totalSeats}</td>
                  <td>{s.theatreName}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
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
            <h2>Add Screen</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Screen Name</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Total Rows</label>
                <input type="number" min="1" value={form.totalRows} onChange={(e) => set("totalRows", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Seats per Row</label>
                <input type="number" min="1" value={form.seatsPerRow} onChange={(e) => set("seatsPerRow", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Theatre</label>
                <select value={form.theatreId} onChange={(e) => set("theatreId", e.target.value)} required>
                  <option value="">Select a theatre</option>
                  {theatres.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.cityName})</option>
                  ))}
                </select>
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

export default AdminScreens;
