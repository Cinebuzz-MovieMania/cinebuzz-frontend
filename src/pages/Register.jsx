import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthAPI } from "../services/api";
import { navigateAfterClosingAuthPanel } from "../utils/authNav";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const paymentFlow = location.state?.reason === "payment";

  const handleClose = () => {
    navigateAfterClosingAuthPanel(navigate, location.state);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    navigateAfterClosingAuthPanel(navigate, location.state);
  }, [authLoading, user, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await AuthAPI.post("/register", { name, email, password });
      const data = res.data.data;
      login(data);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <button type="button" className="login-card-close" onClick={handleClose} aria-label="Close">
          ×
        </button>
        <div className="login-brand">CineBuzz</div>
        <h2>Create account</h2>
        {paymentFlow ? (
          <p className="login-subtitle login-subtitle-payment">
            Create an account to complete payment for your seats.
          </p>
        ) : (
          <p className="login-subtitle">Sign up to book tickets and explore showtimes</p>
        )}

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="login-switch">
          Already have an account?{" "}
          <Link
            to="/login"
            state={{
              from: location.state?.from,
              home: location.state?.home,
              reason: location.state?.reason,
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
