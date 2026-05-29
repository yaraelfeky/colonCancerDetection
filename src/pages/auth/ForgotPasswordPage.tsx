import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { getAxiosErrorMessage } from "../../utils/axiosError";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const value = emailOrPhone.trim();
    if (!value) {
      setError("Please enter your email or phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.forgotPassword({ emailOrPhone: value });
      const message =
        result.message ||
        "If that account exists, a reset code has been sent.";
      setSuccess(message);
      navigate("/reset-password", {
        state: { emailOrPhone: value, successMessage: message },
      });
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <div className="auth-card-left">
          <div className="auth-card-left-bg" />
          <div className="auth-card-left-overlay" />
          <div className="auth-card-left-content">
            <h1 className="auth-card-left-title">Forgot Password?</h1>
            <p className="auth-card-left-sub">
              We&apos;ll send a reset code to your email or phone.
            </p>
          </div>
        </div>

        <div className="auth-card-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Forgot Password</h2>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
              Enter the email or phone number associated with your account and
              we&apos;ll send you a reset code.
            </p>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="forgot-email-or-phone">
                Email or Phone
              </label>
              <input
                id="forgot-email-or-phone"
                type="text"
                className={`auth-input ${error ? "error" : ""}`}
                placeholder="Email or phone number"
                value={emailOrPhone}
                onChange={(e) => {
                  setEmailOrPhone(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                autoComplete="username"
              />
            </div>

            {error && <p className="auth-error-msg">{error}</p>}
            {success && <p className="auth-success-msg">{success}</p>}

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
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
