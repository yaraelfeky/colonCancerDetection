import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!firstName.trim()) newErrors.firstName = "Please enter your first name.";
    if (!lastName.trim()) newErrors.lastName = "Please enter your last name.";
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
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!termsChecked) {
      setErrors((prev) => ({ ...prev, terms: "You must accept the Terms & Conditions." }));
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/login");
    }, 900);
  };

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <div className="auth-card-left">
          <div className="auth-card-left-bg" />
          <div className="auth-card-left-overlay" />
          <div className="auth-card-left-content">
            <h1 className="auth-card-left-title">Create your Account</h1>
            <p className="auth-card-left-sub">Toward a helthier life!</p>
          </div>
        </div>

        <div className="auth-card-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Sign Up</h2>

            <div className="auth-row">
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  type="text"
                  className={`auth-input ${errors.firstName ? "error" : ""}`}
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearError("firstName");
                  }}
                />
                {errors.firstName && <p className="auth-error-msg">{errors.firstName}</p>}
              </div>
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  className={`auth-input ${errors.lastName ? "error" : ""}`}
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearError("lastName");
                  }}
                />
                {errors.lastName && <p className="auth-error-msg">{errors.lastName}</p>}
              </div>
            </div>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className={`auth-input ${errors.email ? "error" : ""}`}
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
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
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                  if (confirmPassword) clearError("confirmPassword");
                }}
              />
              {errors.password && <p className="auth-error-msg">{errors.password}</p>}
            </div>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                className={`auth-input ${errors.confirmPassword ? "error" : ""}`}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearError("confirmPassword");
                }}
              />
              {errors.confirmPassword && <p className="auth-error-msg">{errors.confirmPassword}</p>}
            </div>

            <div className="auth-check-wrap">
              <input
                id="terms"
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => {
                  setTermsChecked(e.target.checked);
                  clearError("terms");
                }}
              />
              <label htmlFor="terms">Accept Terms & Conditions</label>
            </div>
            {errors.terms && <p className="auth-error-msg">{errors.terms}</p>}

            <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Join us"}
              <span>→</span>
            </button>

            <div className="auth-divider-wrap">
              <span className="auth-divider-line" />
              <p className="auth-divider-text">or</p>
              <span className="auth-divider-line" />
            </div>

            <button type="button" className="auth-btn-social">
              <span>G</span>
              Sign up with Google
            </button>

            <p className="auth-form-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;