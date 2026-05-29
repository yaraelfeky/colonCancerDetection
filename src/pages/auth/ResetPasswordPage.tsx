import React, { useEffect , useState, FormEvent } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { getAxiosErrorMessage } from "../../utils/axiosError";

interface ResetPasswordLocationState {
  emailOrPhone?: string;
  successMessage?: string;
}

const RESET_SUCCESS_MESSAGE =
  "Password reset successfully. Please log in with your new password.";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResetPasswordLocationState | null;

  const [emailOrPhone, setEmailOrPhone] = useState(
    () => state?.emailOrPhone?.trim() ?? ""
  );
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    emailOrPhone?: string;
    otpCode?: string;
    newPassword?: string;
    confirmNewPassword?: string;
  }>({});

  const [showSuccess, setShowSuccess] = useState(true);

useEffect(() => {
  if (!state?.successMessage) return;

  const timer = setTimeout(() => {
    setShowSuccess(false);
  }, 3000);

  return () => clearTimeout(timer);
}, [state?.successMessage]);

  if (!state?.emailOrPhone?.trim()) {
    return <Navigate to="/forgot-password" replace />;
  }

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const nextFieldErrors: typeof fieldErrors = {};
    const trimmedEmailOrPhone = emailOrPhone.trim();
    const trimmedOtp = otpCode.trim();

    if (!trimmedEmailOrPhone) {
      nextFieldErrors.emailOrPhone = "Please enter your email or phone number.";
    }
    if (!trimmedOtp) {
      nextFieldErrors.otpCode = "Please enter the OTP code.";
    }
    if (!newPassword) {
      nextFieldErrors.newPassword = "Please enter a new password.";
    }
    if (!confirmNewPassword) {
      nextFieldErrors.confirmNewPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmNewPassword) {
      nextFieldErrors.confirmNewPassword = "Passwords do not match.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await authService.resetPassword({
        emailOrPhone: trimmedEmailOrPhone,
        otpCode: trimmedOtp,
        newPassword,
        confirmNewPassword,
      });

      const message = result.message || RESET_SUCCESS_MESSAGE;
      navigate("/login", {
        replace: true,
        state: { successMessage: message },
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
            <h1 className="auth-card-left-title">Reset Password</h1>
            <p className="auth-card-left-sub">
              Enter the code we sent and choose a new password.
            </p>
          </div>
        </div>

        <div className="auth-card-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Reset Password</h2>

            {/* {state?.successMessage && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-700">
                ✓ {state.successMessage}
              </p>
            </div>
            )} */}
            {showSuccess && state?.successMessage && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                <p className="text-sm font-medium text-green-700">
                  ✓ {state.successMessage}
                </p>
              </div>
            )}

            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
              Enter the reset code and your new password below.
            </p>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="reset-email-or-phone">
                Email or Phone
              </label>
              <input
                id="reset-email-or-phone"
                type="text"
                className={`auth-input ${fieldErrors.emailOrPhone ? "error" : ""}`}
                placeholder="Email or phone number"
                value={emailOrPhone}
                onChange={(e) => {
                  setEmailOrPhone(e.target.value);
                  clearFieldError("emailOrPhone");
                }}
                autoComplete="username"
              />
              {fieldErrors.emailOrPhone && (
                <p className="auth-error-msg">{fieldErrors.emailOrPhone}</p>
              )}
            </div>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="reset-otp">
                OTP Code
              </label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className={`auth-input ${fieldErrors.otpCode ? "error" : ""}`}
                placeholder="Enter the code you received"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  clearFieldError("otpCode");
                }}
              />
              {fieldErrors.otpCode && (
                <p className="auth-error-msg">{fieldErrors.otpCode}</p>
              )}
            </div>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="reset-new-password">
                New Password
              </label>
              <div className="auth-password-wrap">
                <input
                  id="reset-new-password"
                  type={showPassword ? "text" : "password"}
                  className={`auth-input ${fieldErrors.newPassword ? "error" : ""}`}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearFieldError("newPassword");
                    if (confirmNewPassword) {
                      clearFieldError("confirmNewPassword");
                    }
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="auth-error-msg">{fieldErrors.newPassword}</p>
              )}
            </div>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="reset-confirm-password">
                Confirm New Password
              </label>
              <div className="auth-password-wrap">
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`auth-input ${fieldErrors.confirmNewPassword ? "error" : ""}`}
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    clearFieldError("confirmNewPassword");
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmNewPassword && (
                <p className="auth-error-msg">{fieldErrors.confirmNewPassword}</p>
              )}
            </div>

            {error && <p className="auth-error-msg">{error}</p>}

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
              <span>→</span>
            </button>

            <p className="auth-form-footer" style={{ marginTop: "8px" }}>
              <Link to="/forgot-password">← Request a new code</Link>
            </p>
            <p className="auth-form-footer">
              Back to <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
