import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setphoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [professionalPracticeLicense, setProfessionalPracticeLicense] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
    professionalPracticeLicense?: string;
    issuingAuthority?: string;
    terms?: string;
    submit?: string;
  }>({});

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: {
      username?: string;
      email?: string;
      phoneNumber?: string;
      password?: string;
      confirmPassword?: string;
      professionalPracticeLicense?: string;
      issuingAuthority?: string;
      terms?: string;
    } = {};

    if (!username.trim()) newErrors.username = "Please enter your user name.";
    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!phoneNumber) {
      newErrors.phoneNumber = "Please enter your phone Number.";
    } else if (phoneNumber.length < 11) {
      newErrors.phoneNumber = "phone Number must be 11 characters.";
    }
    if (!password) {
      newErrors.password = "Please enter your password.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 8 characters and include at least one uppercase letter and one special character (!@#$%...).";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (isDoctor) {
      if (!professionalPracticeLicense.trim()) {
        newErrors.professionalPracticeLicense = "Please enter your professional practice license.";
      }
      if (!issuingAuthority.trim()) {
        newErrors.issuingAuthority = "Please enter the issuing authority.";
      }
    }
    if (!termsChecked) {
      newErrors.terms = "You must accept the Terms & Conditions.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        confirmPassword,
        isDoctor,
        professionalPracticeLicense: professionalPracticeLicense.trim(),
        issuingAuthority: issuingAuthority.trim(),
      });

      navigate("/login", {
        replace: true,
        state: {
          successMessage: "Registration successful. Please sign in.",
        },
      });
    } catch (err) {
      console.log(err);
      setErrors({
        submit: err instanceof Error ? err.message : "Registration failed. Please try again.",
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
            <h1 className="auth-card-left-title">Create your Account</h1>
            <p className="auth-card-left-sub">Toward a helthier life!</p>
          </div>
        </div>

        <div className="auth-card-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Sign Up</h2>

              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="username">User name</label>
                <input
                  id="username"
                  type="text"
                  className={`auth-input ${errors.username ? "error" : ""}`}
                  placeholder="user name"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError("username");
                  }}
                />
                {errors.username && <p className="auth-error-msg">{errors.username}</p>}
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
              <label className="auth-label" htmlFor="phoneNumber">Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                className={`auth-input ${errors.phoneNumber ? "error" : ""}`}
                placeholder="phone Number"
                value={phoneNumber}
                onChange={(e) => {
                  setphoneNumber(e.target.value);
                  clearError("phoneNumber");
                }}
              />
              {errors.phoneNumber && <p className="auth-error-msg">{errors.phoneNumber}</p>}
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
                id="isDoctor"
                type="checkbox"
                checked={isDoctor}
                onChange={(e) => {
                  setIsDoctor(e.target.checked);
                  if (!e.target.checked) {
                    setProfessionalPracticeLicense("");
                    setIssuingAuthority("");
                  }
                }}
              />
              <label htmlFor="isDoctor">I am a doctor</label>
            </div>

            {isDoctor && (
              <>
                <div className="auth-input-wrap">
                  <label className="auth-label" htmlFor="professionalPracticeLicense">
                    Professional Practice License
                  </label>
                  <input
                    id="professionalPracticeLicense"
                    type="text"
                    className={`auth-input ${errors.professionalPracticeLicense ? "error" : ""}`}
                    placeholder="License number"
                    value={professionalPracticeLicense}
                    onChange={(e) => {
                      setProfessionalPracticeLicense(e.target.value);
                      clearError("professionalPracticeLicense");
                    }}
                  />
                  {errors.professionalPracticeLicense && (
                    <p className="auth-error-msg">{errors.professionalPracticeLicense}</p>
                  )}
                </div>

                <div className="auth-input-wrap">
                  <label className="auth-label" htmlFor="issuingAuthority">Issuing Authority</label>
                  <input
                    id="issuingAuthority"
                    type="text"
                    className={`auth-input ${errors.issuingAuthority ? "error" : ""}`}
                    placeholder="Authority name"
                    value={issuingAuthority}
                    onChange={(e) => {
                      setIssuingAuthority(e.target.value);
                      clearError("issuingAuthority");
                    }}
                  />
                  {errors.issuingAuthority && <p className="auth-error-msg">{errors.issuingAuthority}</p>}
                </div>
              </>
            )}

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
            {errors.submit && <p className="auth-error-msg">{errors.submit}</p>}

            <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Join us"}
              <span>→</span>
            </button>

            {/* <div className="auth-divider-wrap">
              <span className="auth-divider-line" />
              <p className="auth-divider-text">or</p>
              <span className="auth-divider-line" />
            </div>

            <button type="button" className="auth-btn-social">
              <span>G</span>
              Sign up with Google
            </button> */}

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