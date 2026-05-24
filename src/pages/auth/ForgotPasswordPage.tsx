import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { getAxiosErrorMessage } from "../../utils/axiosError";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Step 1: Enter email
  // Step 2: Enter OTP + new password
  const [step, setStep] = useState<"email" | "reset">("email");

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Step 1: Send OTP to email ─────────────────────────────────────────────
  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSuccess("A verification code has been sent to your email.");
      setStep("reset");
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Reset password with OTP ──────────────────────────────────────
  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpCode.trim()) {
      setError("Please enter the verification code from your email.");
      return;
    }
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        otpCode: otpCode.trim(),
        newPassword,
        confirmNewPassword,
      });
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", {
          state: { successMessage: "Password updated. Please sign in with your new password." },
        });
      }, 2000);
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        {/* Left panel */}
        <div className="auth-card-left">
          <div className="auth-card-left-bg" />
          <div className="auth-card-left-overlay" />
          <div className="auth-card-left-content">
            <h1 className="auth-card-left-title">
              {step === "email" ? "Forgot Password?" : "Reset Password"}
            </h1>
            <p className="auth-card-left-sub">
              {step === "email"
                ? "We'll send a verification code to your email."
                : "Enter the code and choose a new password."}
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-card-right">
          {step === "email" ? (
            <form className="auth-form" onSubmit={handleEmailSubmit}>
              <h2 className="auth-form-title">Forgot Password</h2>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
                Enter the email address associated with your account and we'll send you a reset code.
              </p>

              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="forgot-email">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className={`auth-input ${error ? "error" : ""}`}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  autoComplete="email"
                />
              </div>

              {error && <p className="auth-error-msg">{error}</p>}
              {success && (
                <p style={{ color: "#10b981", fontSize: "14px", marginBottom: "8px" }}>
                  ✓ {success}
                </p>
              )}

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Code"}
                <span>→</span>
              </button>

              <p className="auth-form-footer">
                Remember your password? <Link to="/login">Sign in</Link>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleResetSubmit}>
              <h2 className="auth-form-title">Reset Password</h2>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
                We sent a code to <strong>{email}</strong>. Enter it below along with your new password.
              </p>

              {/* OTP */}
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="reset-otp">
                  Verification Code
                </label>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`auth-input ${error ? "error" : ""}`}
                  placeholder="Enter the code from your email"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value);
                    setError("");
                  }}
                />
              </div>

              {/* New Password */}
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="reset-new-password">
                  New Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="reset-new-password"
                    type={showPassword ? "text" : "password"}
                    className={`auth-input ${error ? "error" : ""}`}
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="reset-confirm-password">
                  Confirm New Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className={`auth-input ${error ? "error" : ""}`}
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setError("");
                    }}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="auth-error-msg">{error}</p>}
              {success && (
                <p style={{ color: "#10b981", fontSize: "14px", marginBottom: "8px" }}>
                  ✓ {success}
                </p>
              )}

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
                <span>→</span>
              </button>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                  onClick={() => {
                    setStep("email");
                    setOtpCode("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setError("");
                    setSuccess("");
                  }}
                >
                  ← Change email
                </button>
              </div>

              <p className="auth-form-footer">
                Back to <Link to="/login">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
