import { useCallback, useEffect, useState } from "react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function roleLabel(role) {
  if (role === "ROLE_SUPER_ADMIN") return "Super admin";
  if (role === "ROLE_ADMIN") return "Admin";
  if (role === "ROLE_USER") return "Member";
  return role || "—";
}

function AdminUsers() {
  const { user: me, isSuperAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    API.get("/users", { params })
      .then((res) => setRows(res.data.data || []))
      .catch((err) => {
        const msg = err.response?.data?.message || "Could not load members.";
        alert(msg);
      })
      .finally(() => setLoading(false));
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const applySearch = () => {
    setSearchQuery(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const promote = (id) => {
    if (!confirm("Promote this member to administrator?")) return;
    setBusyId(id);
    API.put(`/users/${id}/promote`)
      .then(() => {
        alert("User promoted to administrator.");
        fetchUsers();
      })
      .catch((err) => alert(err.response?.data?.message || "Promote failed"))
      .finally(() => setBusyId(null));
  };

  const demote = (id) => {
    if (!confirm("Remove administrator rights from this user? They will become a regular member.")) return;
    setBusyId(id);
    API.put(`/users/${id}/demote`)
      .then(() => {
        alert("Administrator rights removed.");
        fetchUsers();
      })
      .catch((err) => alert(err.response?.data?.message || "Demote failed"))
      .finally(() => setBusyId(null));
  };

  if (loading) return <div className="loading">Loading members…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Members &amp; roles</h1>
        <button type="button" className="btn btn-secondary" onClick={fetchUsers}>
          Refresh
        </button>
      </div>

      <div className="admin-search-bar" style={{ marginBottom: "1rem" }}>
        <input
          type="search"
          className="admin-search-input"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applySearch();
            }
          }}
          aria-label="Search members by name or email"
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => applySearch()}>
          Search
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={clearSearch}>
          Clear
        </button>
      </div>

      <p style={{ marginBottom: "1rem", maxWidth: "42rem", color: "var(--text-muted)" }}>
        Only the <strong>super admin</strong> can promote a <strong>member</strong> to <strong>admin</strong> or remove
        admin rights from a promoted admin.
      </p>

      <div className="table-container">
        {rows.length === 0 ? (
          <div className="empty">
            {searchQuery.trim() ? "No members match your search." : "No users found."}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const myId = me?.userId ?? me?.id;
                const isSelf = myId != null && u.id === myId;
                const canPromote = u.role === "ROLE_USER";
                const canDemote = u.role === "ROLE_ADMIN" && isSuperAdmin();
                const disabled = busyId === u.id;
                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      {u.name}
                      {isSelf ? " (you)" : ""}
                    </td>
                    <td>{u.email}</td>
                    <td>{roleLabel(u.role)}</td>
                    <td>
                      {canPromote && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={disabled}
                          onClick={() => promote(u.id)}
                        >
                          Promote to admin
                        </button>
                      )}
                      {canDemote && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ marginLeft: canPromote ? "0.5rem" : 0 }}
                          disabled={disabled}
                          onClick={() => demote(u.id)}
                        >
                          Remove admin
                        </button>
                      )}
                      {!canPromote && !canDemote && "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
