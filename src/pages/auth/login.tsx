import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
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
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/");
    }, 800);
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

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className={`auth-input ${errors.email ? "error" : ""}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
              />
              {errors.email && <p className="auth-error-msg">{errors.email}</p>}
            </div>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={`auth-input ${errors.password ? "error" : ""}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />
              {errors.password && <p className="auth-error-msg">{errors.password}</p>}
            </div>

            <div className="auth-check-wrap">
              <input id="remember" type="checkbox" />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
              <span>→</span>
            </button>

            <div className="auth-divider-wrap">
              <span className="auth-divider-line" />
              <p className="auth-divider-text">or</p>
              <span className="auth-divider-line" />
            </div>

            <button type="button" className="auth-btn-social">
              <span>G</span>
              Sign in with Google
            </button>
           

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