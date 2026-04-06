import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthAPI } from "../services/api";
import { navigateAfterClosingAuthPanel } from "../utils/authNav";

const RESEND_SECONDS = 25;
const CODE_LEN = 8;

function ForgotPassword() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    navigateAfterClosingAuthPanel(navigate, location.state);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const startCooldown = (seconds) => {
    setResendCooldown(typeof seconds === "number" && seconds > 0 ? seconds : RESEND_SECONDS);
  };

  const requestCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await AuthAPI.post("/forgot-password/request", { email: email.trim() });
      const meta = res.data.data;
      setRequestMessage(res.data.message || "");
      setStep("reset");
      setCode("");
      startCooldown(meta?.nextResendAllowedInSeconds ?? RESEND_SECONDS);
    } catch (err) {
      const msg = err.response?.data?.message;
      const retry = err.response?.data?.data?.retryAfterSeconds;
      if (err.response?.status === 429 && retry != null) {
        startCooldown(retry);
        setError(msg || "Please wait before requesting another code.");
      } else {
        setError(msg || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await AuthAPI.post("/forgot-password/resend", { email: email.trim() });
      const meta = res.data.data;
      startCooldown(meta?.nextResendAllowedInSeconds ?? RESEND_SECONDS);
    } catch (err) {
      const msg = err.response?.data?.message;
      const retry = err.response?.data?.data?.retryAfterSeconds;
      if (err.response?.status === 429 && retry != null) {
        startCooldown(retry);
        setError(msg || "Please wait before requesting another code.");
      } else {
        setError(msg || "Could not resend code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const normalized = code.trim().toUpperCase().replace(/\s/g, "");
    if (normalized.length !== CODE_LEN) {
      setError(`Enter the ${CODE_LEN}-character code from your email.`);
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.post("/forgot-password/reset", {
        email: email.trim(),
        code: normalized,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <button type="button" className="login-card-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
          <div className="login-brand">CineBuzz</div>
          <h2>Password updated</h2>
          <p className="login-subtitle">You can sign in with your new password.</p>
          <Link
            className="btn btn-primary login-btn"
            to="/login"
            state={{
              from: location.state?.from,
              home: location.state?.home,
              reason: location.state?.reason,
            }}
            style={{ display: "block", textAlign: "center", textDecoration: "none" }}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <button type="button" className="login-card-close" onClick={handleClose} aria-label="Close">
          ×
        </button>
        <div className="login-brand">CineBuzz</div>
        <h2>Reset password</h2>
        <p className="login-subtitle">
          {step === "email"
            ? "Enter your account email. We will send an 8-character code."
            : "Enter the code from your email and choose a new password."}
        </p>
        {step === "reset" && requestMessage && (
          <p className="login-subtitle" style={{ fontSize: "13px", marginTop: "-12px", marginBottom: "16px" }}>
            {requestMessage}
          </p>
        )}

        {error && <div className="login-error">{error}</div>}

        {step === "email" && (
          <form onSubmit={requestCode}>
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
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? "Sending…" : "Send reset code"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={submitReset}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email.trim()} readOnly disabled style={{ opacity: 0.85 }} />
            </div>
            <div className="form-group">
              <label>Reset code (8 characters)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LEN))}
                placeholder="Enter code"
                required
                autoComplete="one-time-code"
                maxLength={CODE_LEN}
                className="forgot-code-input"
              />
            </div>
            <p className="login-subtitle" style={{ fontSize: "12px", marginTop: "-8px" }}>
              Didn&apos;t get it?{" "}
              {resendCooldown > 0 ? (
                <span style={{ color: "var(--text-light)" }}>Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  className="register-otp-resend-link"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  disabled={loading}
                  onClick={resendCode}
                >
                  Resend code
                </button>
              )}
            </p>
            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label>Confirm new password</label>
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
              {loading ? "Updating…" : "Update password"}
            </button>
            <button
              type="button"
              className="btn btn-secondary login-btn"
              style={{ marginTop: "8px" }}
              onClick={() => {
                setStep("email");
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
              }}
            >
              Use different email
            </button>
          </form>
        )}

        <p className="login-switch">
          <Link
            to="/login"
            state={{
              from: location.state?.from,
              home: location.state?.home,
              reason: location.state?.reason,
            }}
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
