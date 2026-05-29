import React, { useState, FormEvent, useMemo } from "react";
import { Link , useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { getAxiosErrorMessage } from "../../utils/axiosError";
import type { RegisterRequestDto } from "../../types/auth";
import {
  clearGoogleRegistrationIdToken,
  GOOGLE_REGISTRATION_PENDING_MESSAGE,
  readGoogleRegistrationIdToken,
} from "../../utils/googleLoginFlow";

interface VerificationLocationState {
  registrationData?: {
    username: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
  };
  googleIdToken?: string;
}

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, googleRegister } = useAuth();

  const state = location.state as VerificationLocationState | null;

  const googleIdToken = useMemo(() => {
    return state?.googleIdToken ?? readGoogleRegistrationIdToken() ?? undefined;
  }, [state?.googleIdToken]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [professionalPracticeLicense, setProfessionalPracticeLicense] =
    useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [errors, setErrors] = useState<{
    professionalPracticeLicense?: string;
    issuingAuthority?: string;
    submit?: string;
  }>({});

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (!state?.registrationData && !googleIdToken) {
    return <Navigate to="/register" replace />;
  }

  const isGoogleFlow = !!googleIdToken;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!professionalPracticeLicense.trim()) {
      newErrors.professionalPracticeLicense =
        "Please enter your professional practice license.";
    }
    if (!issuingAuthority.trim()) {
      newErrors.issuingAuthority = "Please enter the issuing authority.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (isGoogleFlow) {
        await googleRegister({
          idToken: googleIdToken,
          professionalPracticeLicense: professionalPracticeLicense.trim(),
          issuingAuthority: issuingAuthority.trim(),
        });
        clearGoogleRegistrationIdToken();
      } else {
        const regData = state!.registrationData!;
        const dto: RegisterRequestDto = {
          username: regData.username,
          email: regData.email,
          phoneNumber: regData.phoneNumber,
          password: regData.password,
          confirmPassword: regData.confirmPassword,
          isDoctor: true,
          professionalPracticeLicense: professionalPracticeLicense.trim(),
          issuingAuthority: issuingAuthority.trim(),
        };
        await register(dto);
      }

      navigate("/login", {
        replace: true,
        state: {
          successMessage: isGoogleFlow
            ? GOOGLE_REGISTRATION_PENDING_MESSAGE
            : "Registration successful! Your account is pending admin approval. You will be able to login once approved.",
        },
      });
    } catch (err) {
      setErrors({
        submit: getAxiosErrorMessage(err),
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
            <h1 className="auth-card-left-title">Doctor Verification</h1>
            <p className="auth-card-left-sub">
              One last step to complete your registration
            </p>
          </div>
        </div>

        <div className="auth-card-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Verify Your License</h2>

            <p
              style={{
                textAlign: "center",
                color: "#555",
                fontSize: "0.9rem",
                margin: 0,
              }}
            >
              Please provide your professional credentials to complete
              registration.
            </p>

            <div className="auth-input-wrap">
              <label
                className="auth-label"
                htmlFor="professionalPracticeLicense"
              >
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
                <p className="auth-error-msg">
                  {errors.professionalPracticeLicense}
                </p>
              )}
            </div>

            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="issuingAuthority">
                Issuing Authority
              </label>
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
              {errors.issuingAuthority && (
                <p className="auth-error-msg">{errors.issuingAuthority}</p>
              )}
            </div>

            {errors.submit && <p className="auth-error-msg">{errors.submit}</p>}

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Complete Registration"}
              <span>→</span>
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

export default VerificationPage;
