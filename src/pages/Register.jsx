import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthAPI } from "../services/api";
import { navigateAfterClosingAuthPanel } from "../utils/authNav";

const RESEND_SECONDS = 25;
const OTP_EXPIRES_MIN = 2;
const OTP_LEN = 6;

const emptyOtpDigits = () => Array(OTP_LEN).fill("");

function Register() {
  const [step, setStep] = useState("email"); // email | otp | profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(emptyOtpDigits);
  const otpInputRefs = useRef([]);
  const otp = otpDigits.join("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
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

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (step !== "otp") return;
    const t = setTimeout(() => otpInputRefs.current[0]?.focus(), 80);
    return () => clearTimeout(t);
  }, [step]);

  const startCooldown = (seconds) => {
    setResendCooldown(typeof seconds === "number" && seconds > 0 ? seconds : RESEND_SECONDS);
  };

  const sendOtp = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await AuthAPI.post("/register/send-otp", { email: email.trim() });
      const meta = res.data.data;
      setStep("otp");
      setOtpDigits(emptyOtpDigits());
      startCooldown(meta?.nextResendAllowedInSeconds ?? RESEND_SECONDS);
    } catch (err) {
      const msg = err.response?.data?.message;
      const retry = err.response?.data?.data?.retryAfterSeconds;
      if (err.response?.status === 429 && retry != null) {
        startCooldown(retry);
        setError(msg || "Please wait before requesting another code.");
      } else {
        setError(msg || "Could not send verification code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await AuthAPI.post("/register/resend-otp", { email: email.trim() });
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

  const focusOtpIndex = (i) => {
    const el = otpInputRefs.current[i];
    if (el) el.focus();
    el?.select?.();
  };

  const handleOtpDigitChange = (index, value) => {
    const d = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < OTP_LEN - 1) {
      setTimeout(() => focusOtpIndex(index + 1), 0);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key !== "Backspace") return;
    e.preventDefault();
    if (otpDigits[index]) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
    } else if (index > 0) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      setTimeout(() => focusOtpIndex(index - 1), 0);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!text) return;
    const chars = text.split("");
    const next = emptyOtpDigits();
    chars.forEach((c, i) => {
      if (i < OTP_LEN) next[i] = c;
    });
    setOtpDigits(next);
    const focusAt = Math.min(chars.length, OTP_LEN - 1);
    setTimeout(() => focusOtpIndex(focusAt), 0);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LEN) return;
    setError("");
    setLoading(true);
    try {
      const res = await AuthAPI.post("/register/verify-otp", {
        email: email.trim(),
        otp,
      });
      const token = res.data.data?.registrationToken;
      if (!token) {
        setError("Invalid response from server.");
        return;
      }
      setRegistrationToken(token);
      setStep("profile");
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (e) => {
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
      const res = await AuthAPI.post("/register/complete", {
        registrationToken,
        name: name.trim(),
        password,
      });
      const data = res.data.data;
      login(data);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmail = () => {
    setStep("email");
    setOtpDigits(emptyOtpDigits());
    setError("");
  };

  return (
    <div className="login-page">
      <div className={`login-card${step === "otp" ? " login-card--otp-verify" : ""}`}>
        <button type="button" className="login-card-close" onClick={handleClose} aria-label="Close">
          ×
        </button>

        {step === "otp" ? (
          <>
            <button type="button" className="register-otp-back" onClick={goBackToEmail} aria-label="Back">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 6l-6 6 6 6"
                />
              </svg>
            </button>
            <h2 className="register-otp-title">Verify your Email Address</h2>
            <p className="register-otp-instruction">
              Enter OTP sent to <strong className="register-otp-email">{email.trim() || "your email"}</strong>
            </p>
          </>
        ) : (
          <>
            <div className="login-brand">CineBuzz</div>
            <h2>Create account</h2>
            {paymentFlow ? (
              <p className="login-subtitle login-subtitle-payment">
                Create an account to complete payment for your seats.
              </p>
            ) : (
              <p className="login-subtitle">Sign up to book tickets and explore showtimes</p>
            )}
          </>
        )}

        {error && <div className="login-error">{error}</div>}

        {step === "email" && (
          <form onSubmit={sendOtp}>
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
            <p className="login-subtitle" style={{ fontSize: "13px", marginTop: "-4px" }}>
              We&apos;ll send a 6-digit code to verify your email. The code expires in {OTP_EXPIRES_MIN}{" "}
              minutes. You can request a new code after {RESEND_SECONDS} seconds.
            </p>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? "Sending…" : "Send verification code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form className="register-otp-form" onSubmit={verifyOtp}>
            <div
              className="otp-digit-row"
              onPaste={handleOtpPaste}
              role="group"
              aria-label="One-time code"
            >
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpInputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  className="otp-digit-input"
                  value={digit}
                  aria-label={`Digit ${i + 1}`}
                  onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>
            <p className="register-otp-expiry-hint">Code expires in {OTP_EXPIRES_MIN} minutes.</p>

            <p className="register-otp-resend">
              Didn&apos;t receive OTP?{" "}
              {resendCooldown > 0 ? (
                <span className="register-otp-resend-wait">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  className="register-otp-resend-link"
                  disabled={loading}
                  onClick={resendOtp}
                >
                  Resend OTP
                </button>
              )}
            </p>

            <button
              type="submit"
              className="register-otp-continue"
              disabled={loading || otp.length !== OTP_LEN}
            >
              {loading ? "Verifying…" : "Continue"}
            </button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={completeRegistration}>
            <p className="login-subtitle" style={{ fontSize: "14px" }}>
              Email verified. Choose your name and password.
            </p>
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
              <input type="email" value={email.trim()} readOnly disabled style={{ opacity: 0.85 }} />
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        {step !== "otp" && (
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
        )}
      </div>
    </div>
  );
}

export default Register;
