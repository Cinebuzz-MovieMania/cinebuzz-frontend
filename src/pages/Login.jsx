import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthBackButton } from "../components/AuthBackButton";
import { AuthAPI } from "../services/api";
import { navigateAfterClosingAuthPanel } from "../utils/authNav";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setLoading(true);

    try {
      const res = await AuthAPI.post("/login", { email, password });
      const data = res.data.data;
      login(data);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <AuthBackButton onClick={handleClose} ariaLabel="Back" />
        <div className="login-brand">CineBuzz</div>
        <h2>Sign in</h2>
        {paymentFlow ? (
          <p className="login-subtitle login-subtitle-payment">
            You need to sign in to complete payment for your seats.
          </p>
        ) : (
          <p className="login-subtitle">Book tickets and browse movies in your city</p>
        )}

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cinebuzz.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="login-forgot-wrap">
            <Link
              to="/forgot-password"
              className="login-forgot-link"
              state={{
                from: location.state?.from,
                home: location.state?.home,
                reason: location.state?.reason,
              }}
            >
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="login-switch">
          New to CineBuzz?{" "}
          <Link
            to="/register"
            state={{
              from: location.state?.from,
              home: location.state?.home,
              reason: location.state?.reason,
            }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
