import React, { useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ usernameOrEmail?: string; password?: string; submit?: string }>({});
  const successMessage =
    (location.state as { successMessage?: string } | null | undefined)?.successMessage;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: { usernameOrEmail?: string; password?: string } = {};

    if (!usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = "Please enter your username or email.";
    }
    if (!password) {
      newErrors.password = "Please enter your password.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await login({ usernameOrEmail: usernameOrEmail.trim(), password });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : "Sign in failed. Please try again.",
      });
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
            <h1 className="auth-card-left-title">Welcome back</h1>
            <p className="auth-card-left-sub">To a helthier life!</p>
          </div>
        </div>

        <div className="auth-card-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Sign In</h2>

            {successMessage && (
              <p className="auth-success-msg">
                {successMessage}
              </p>
            )}

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="usernameOrEmail">Username or Email</label>
              <input
                id="usernameOrEmail"
                type="text"
                className={`auth-input ${errors.usernameOrEmail ? "error" : ""}`}
                placeholder="Username or email"
                value={usernameOrEmail}
                onChange={(e) => {
                  setUsernameOrEmail(e.target.value);
                  if (errors.usernameOrEmail) setErrors((prev) => ({ ...prev, usernameOrEmail: undefined }));
                }}
              />
              {errors.usernameOrEmail && <p className="auth-error-msg">{errors.usernameOrEmail}</p>}
            </div>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="password">Password</label>
              <div className="auth-password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`auth-input ${errors.password ? "error" : ""}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
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
              {errors.password && <p className="auth-error-msg">{errors.password}</p>}
            </div>

            <div className="auth-check-wrap">
              <input id="remember" type="checkbox" />
              <label htmlFor="remember">Remember me</label>
            </div>

            {errors.submit && <p className="auth-error-msg">{errors.submit}</p>}

            <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
              <span>→</span>
            </button>

            {/* <div className="auth-divider-wrap">
              <span className="auth-divider-line" />
              <p className="auth-divider-text">or</p>
              <span className="auth-divider-line" />
            </div>

            <button type="button" className="auth-btn-social">
              <span>G</span>
              Sign in with Google
            </button> */}

            <p className="auth-form-footer">
              Don&apos;t have an account? <Link to="/register">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;