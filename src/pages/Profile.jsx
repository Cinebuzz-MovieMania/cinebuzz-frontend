import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PublicAPI } from "../services/api";

function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    const prev = document.title;
    document.title = "Edit profile · CineBuzz";
    return () => {
      document.title = prev;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await PublicAPI.patch("/users/me", { name: name.trim() });
      const data = res.data.data;
      updateUser({
        name: data.name,
        email: data.email,
        userId: data.userId,
        role: data.role,
      });
      setSuccess("Your name was updated.");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK" ? "Network error — check API is running and CORS allows PATCH." : null) ||
        err.message ||
        "Could not update profile";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page profile-page">
      <div className="profile-card-wrap">
        <button type="button" className="back-btn profile-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="profile-card">
          <h1 className="profile-page-title">Edit profile</h1>
          <p className="profile-hint">Update how your name appears across CineBuzz.</p>
          {user?.email && (
            <p className="profile-email-readonly">
              <span className="profile-email-label">Email</span>
              {user.email}
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="profile-name">Display name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                autoComplete="name"
                required
              />
            </div>
            {error && <div className="login-error profile-msg">{error}</div>}
            {success && <div className="profile-success profile-msg">{success}</div>}
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
