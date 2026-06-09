import React, { useState, FormEvent, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { getAxiosErrorMessage } from "../utils/axiosError";
import {
  resolveDisplayEmail,
  resolveDisplayUserName,
} from "../utils/authUser";
import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";
import Container from "../components/Layout/Container";
import ScrollReveal from "../components/ScrollReveal";
import {
  Mail,
  User,
  Lock,
  Save,
  AlertCircle,
  Shield,
  Trash2,
  Loader2,
  FileText,
  Phone,
  Calendar,
  Image as ImageIcon
} from "lucide-react";
import { doctorService } from "../services/doctorService";

type ToastVariant = "success" | "error";

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500"
      : "border-slate-300 focus:ring-[#2b7fff] focus:border-[#2b7fff]"
  }`;

const primaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    doctorProfile,
    updateMail,
    updateUsername,
    requestPasswordChange,
    confirmPasswordChange,
    deleteAccount,
  } = useAuth();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("success");

  const displayUserName =
    resolveDisplayUserName(user, doctorProfile?.userName) || "—";
  const displayEmail =
    resolveDisplayEmail(user, doctorProfile?.email) || "—";

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 4500);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  // --- Account: Email ---
  const [newEmail, setNewEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailFieldError, setEmailFieldError] = useState("");

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailFieldError("");

    if (!newEmail.trim()) {
      setEmailFieldError("Please enter a new email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setEmailFieldError("Please enter a valid email address.");
      return;
    }

    setEmailSubmitting(true);
    try {
      await updateMail(newEmail.trim());
      showToast("Email updated successfully.");
      setNewEmail("");
    } catch (err) {
      showToast(getAxiosErrorMessage(err), "error");
    } finally {
      setEmailSubmitting(false);
    }
  };

  // --- Account: Doctor Profile ---
  const [profileForm, setProfileForm] = useState({
    UserName: doctorProfile?.userName || user?.userName || "",
    Email: doctorProfile?.email || user?.email || "",
    PhoneNumber: doctorProfile?.phoneNumber || "",
    ProfessionalPracticeLicense: doctorProfile?.professionalPracticeLicense || "",
    IssuingAuthority: doctorProfile?.issuingAuthority || "",
    LicenseExpirationDate: doctorProfile?.licenseExpirationDate ? doctorProfile.licenseExpirationDate.split("T")[0] : "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError("");
    setProfileSubmitting(true);
    
    try {
      const formData = new FormData();
      if (profileImage) {
        formData.append("Image", profileImage);
      }
      formData.append("UserName", profileForm.UserName);
      formData.append("Email", profileForm.Email);
      formData.append("PhoneNumber", profileForm.PhoneNumber);
      formData.append("ProfessionalPracticeLicense", profileForm.ProfessionalPracticeLicense);
      formData.append("IssuingAuthority", profileForm.IssuingAuthority);
      if (profileForm.LicenseExpirationDate) {
        formData.append("LicenseExpirationDate", profileForm.LicenseExpirationDate);
      }

      await doctorService.updateDoctorFormData(formData);
      showToast("Profile updated successfully.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setProfileError(getAxiosErrorMessage(err));
      showToast(getAxiosErrorMessage(err), "error");
    } finally {
      setProfileSubmitting(false);
    }
  };


  // --- Account: Username ---
  const [newUsername, setNewUsername] = useState("");
  const [usernameSubmitting, setUsernameSubmitting] = useState(false);
  const [usernameFieldError, setUsernameFieldError] = useState("");

  const handleUsernameSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUsernameFieldError("");

    if (!newUsername.trim()) {
      setUsernameFieldError("Please enter a new username.");
      return;
    }

    setUsernameSubmitting(true);
    try {
      await updateUsername(newUsername.trim());
      showToast("Username updated successfully.");
      setNewUsername("");
    } catch (err) {
      showToast(getAxiosErrorMessage(err), "error");
    } finally {
      setUsernameSubmitting(false);
    }
  };

  // --- Security: Password ---
  const [passwordStep, setPasswordStep] = useState<"request" | "confirm">("request");
  const [currentPassword, setCurrentPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const resetPasswordForm = () => {
    setPasswordStep("request");
    setCurrentPassword("");
    setOtpCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError("");
  };

  const handlePasswordRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await requestPasswordChange(currentPassword);
      setPasswordStep("confirm");
      showToast("Verification code sent to your email.");
    } catch (err) {
      showToast(getAxiosErrorMessage(err), "error");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handlePasswordConfirm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");

    if (!otpCode.trim()) {
      setPasswordError("Please enter the verification code from your email.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await confirmPasswordChange(
        otpCode.trim(),
        newPassword,
        confirmNewPassword
      );
      showToast("Password updated successfully.");
      resetPasswordForm();
    } catch (err) {
      const msg = getAxiosErrorMessage(err);
      setPasswordError(msg);
      showToast(msg, "error");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // --- Danger zone ---
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const openDeleteModal = () => {
    if (!deletePassword) {
      showToast("Enter your password to continue.", "error");
      return;
    }
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteSubmitting) return;
    setDeleteModalOpen(false);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword) {
      setDeleteError("Password is required.");
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError("");
    try {
      await deleteAccount(deletePassword);
      navigate("/login", {
        replace: true,
        state: {
          successMessage: "Your account has been deleted successfully.",
        },
      });
    } catch (err) {
      const msg = getAxiosErrorMessage(err);
      setDeleteError(msg);
      showToast(msg, "error");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 py-8 md:py-10">
        <Container>
          <div className="mx-auto max-w-3xl">
            <header className="mb-8">
              <p className="text-sm font-medium text-[#2b7fff]">Preferences</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                Settings
              </h1>
              {user && (
                <p className="mt-2 text-slate-500">
                  Signed in as{" "}
                  <span className="font-semibold text-slate-700">
                    {user.userName || user.email}
                  </span>
                </p>
              )}
            </header>

            <div className="space-y-8">
              {/* Account Information */}
              <ScrollReveal variant="fade-up" delay={50}>
              <section aria-labelledby="settings-account-heading">
                <div className="mb-4 flex items-center gap-2">
                  <User className="text-[#2b7fff]" size={20} aria-hidden />
                  <h2
                    id="settings-account-heading"
                    className="text-lg font-bold text-slate-900"
                  >
                    Account Information
                  </h2>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:border-b-0 sm:border-r">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Current username
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {user?.userName || "—"}
                      </p>
                    </div>
                    <div className="bg-slate-50/80 px-5 py-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Current email
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                        {user?.email || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="grid gap-8 md:grid-cols-2">
                      {doctorProfile ? (
                        <form onSubmit={handleProfileSubmit} className="col-span-1 md:col-span-2 space-y-4">
                          <div className="flex items-center gap-2 text-slate-800">
                            <User size={18} className="text-[#2b7fff]" aria-hidden />
                            <h3 className="text-sm font-semibold">Update Doctor Profile</h3>
                          </div>
                          
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                              <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <User className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                  type="text"
                                  className={`${inputClass(false)} pl-10`}
                                  value={profileForm.UserName}
                                  onChange={(e) => setProfileForm({ ...profileForm, UserName: e.target.value })}
                                  disabled={profileSubmitting}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                              <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <Mail className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                  type="email"
                                  className={`${inputClass(false)} pl-10`}
                                  value={profileForm.Email}
                                  onChange={(e) => setProfileForm({ ...profileForm, Email: e.target.value })}
                                  disabled={profileSubmitting}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
                              <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <Phone className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                  type="text"
                                  className={`${inputClass(false)} pl-10`}
                                  value={profileForm.PhoneNumber}
                                  onChange={(e) => setProfileForm({ ...profileForm, PhoneNumber: e.target.value })}
                                  disabled={profileSubmitting}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Profile Image</label>
                              <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <ImageIcon className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className={`${inputClass(false)} pl-10 pt-2`}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      setProfileImage(e.target.files[0]);
                                    }
                                  }}
                                  disabled={profileSubmitting}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Professional Practice License</label>
                              <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <FileText className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                  type="text"
                                  className={`${inputClass(false)} pl-10`}
                                  value={profileForm.ProfessionalPracticeLicense}
                                  onChange={(e) => setProfileForm({ ...profileForm, ProfessionalPracticeLicense: e.target.value })}
                                  disabled={profileSubmitting}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Issuing Authority</label>
                              <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <Shield className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                  type="text"
                                  className={`${inputClass(false)} pl-10`}
                                  value={profileForm.IssuingAuthority}
                                  onChange={(e) => setProfileForm({ ...profileForm, IssuingAuthority: e.target.value })}
                                  disabled={profileSubmitting}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">License Expiration Date</label>
                              <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <Calendar className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                  type="date"
                                  className={`${inputClass(false)} pl-10`}
                                  value={profileForm.LicenseExpirationDate}
                                  onChange={(e) => setProfileForm({ ...profileForm, LicenseExpirationDate: e.target.value })}
                                  disabled={profileSubmitting}
                                />
                              </div>
                            </div>
                          </div>

                          {profileError && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                              <AlertCircle size={14} aria-hidden />
                              {profileError}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={profileSubmitting}
                            className={primaryBtnClass}
                            style={{ backgroundColor: "var(--primary, #2b7fff)" }}
                          >
                            {profileSubmitting ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Save size={18} aria-hidden />
                            )}
                            {profileSubmitting ? "Saving…" : "Save Profile"}
                          </button>
                        </form>
                      ) : (
                        <>
                          <form onSubmit={handleUsernameSubmit} className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-800">
                              <User size={18} className="text-[#2b7fff]" aria-hidden />
                              <h3 className="text-sm font-semibold">Update username</h3>
                            </div>
                            <div>
                              <label
                                className="mb-1 block text-sm font-medium text-slate-700"
                                htmlFor="newUsername"
                              >
                                New username
                              </label>
                              <input
                                id="newUsername"
                                type="text"
                                className={inputClass(!!usernameFieldError)}
                                placeholder="Enter new username"
                                value={newUsername}
                                onChange={(e) => {
                                  setNewUsername(e.target.value);
                                  setUsernameFieldError("");
                                }}
                                disabled={usernameSubmitting}
                                autoComplete="username"
                              />
                              {usernameFieldError && (
                                <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                                  <AlertCircle size={14} aria-hidden />
                                  {usernameFieldError}
                                </p>
                              )}
                            </div>
                            <button
                              type="submit"
                              disabled={usernameSubmitting}
                              className={primaryBtnClass}
                              style={{ backgroundColor: "var(--primary, #2b7fff)" }}
                            >
                              {usernameSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Save size={18} aria-hidden />
                              )}
                              {usernameSubmitting ? "Saving…" : "Save username"}
                            </button>
                          </form>

                          <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-800">
                              <Mail size={18} className="text-[#2b7fff]" aria-hidden />
                              <h3 className="text-sm font-semibold">Update email</h3>
                            </div>
                            <div>
                              <label
                                className="mb-1 block text-sm font-medium text-slate-700"
                                htmlFor="newEmail"
                              >
                                New email
                              </label>
                              <input
                                id="newEmail"
                                type="email"
                                className={inputClass(!!emailFieldError)}
                                placeholder="Enter new email address"
                                value={newEmail}
                                onChange={(e) => {
                                  setNewEmail(e.target.value);
                                  setEmailFieldError("");
                                }}
                                disabled={emailSubmitting}
                                autoComplete="email"
                              />
                              {emailFieldError && (
                                <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                                  <AlertCircle size={14} aria-hidden />
                                  {emailFieldError}
                                </p>
                              )}
                            </div>
                            <button
                              type="submit"
                              disabled={emailSubmitting}
                              className={primaryBtnClass}
                              style={{ backgroundColor: "var(--primary, #2b7fff)" }}
                            >
                              {emailSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Save size={18} aria-hidden />
                              )}
                              {emailSubmitting ? "Saving…" : "Save email"}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>
              </ScrollReveal>

              {/* Security */}
              <ScrollReveal variant="fade-up" delay={100}>
              <section aria-labelledby="settings-security-heading">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="text-[#2b7fff]" size={20} aria-hidden />
                  <h2
                    id="settings-security-heading"
                    className="text-lg font-bold text-slate-900"
                  >
                    Security
                  </h2>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 md:px-6">
                    <div className="rounded-lg bg-blue-50 p-2 text-[#2b7fff]">
                      <Lock size={20} aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Change password</h3>
                      <p className="text-sm text-slate-500">
                        {passwordStep === "request"
                          ? "Verify your current password to receive a one-time code by email."
                          : "Enter the code from your email and choose a new password."}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    {passwordStep === "request" ? (
                      <form
                        onSubmit={handlePasswordRequest}
                        className="max-w-md space-y-4"
                      >
                        <div>
                          <label
                            className="mb-1 block text-sm font-medium text-slate-700"
                            htmlFor="currentPassword"
                          >
                            Current password
                          </label>
                          <input
                            id="currentPassword"
                            type="password"
                            className={inputClass(!!passwordError)}
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => {
                              setCurrentPassword(e.target.value);
                              setPasswordError("");
                            }}
                            disabled={passwordSubmitting}
                            autoComplete="current-password"
                          />
                        </div>

                        {passwordError && (
                          <p className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle size={16} aria-hidden />
                            {passwordError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={passwordSubmitting}
                          className={primaryBtnClass}
                          style={{ backgroundColor: "var(--primary, #2b7fff)" }}
                        >
                          {passwordSubmitting ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Save size={18} aria-hidden />
                          )}
                          {passwordSubmitting
                            ? "Sending…"
                            : "Send verification code"}
                        </button>
                      </form>
                    ) : (
                      <form
                        onSubmit={handlePasswordConfirm}
                        className="max-w-lg space-y-4"
                      >
                        <div>
                          <label
                            className="mb-1 block text-sm font-medium text-slate-700"
                            htmlFor="otpCode"
                          >
                            OTP code
                          </label>
                          <input
                            id="otpCode"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            className={inputClass(!!passwordError)}
                            placeholder="Code from email"
                            value={otpCode}
                            onChange={(e) => {
                              setOtpCode(e.target.value);
                              setPasswordError("");
                            }}
                            disabled={passwordSubmitting}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              className="mb-1 block text-sm font-medium text-slate-700"
                              htmlFor="settingsNewPassword"
                            >
                              New password
                            </label>
                            <input
                              id="settingsNewPassword"
                              type="password"
                              className={inputClass(false)}
                              placeholder="New password"
                              value={newPassword}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                setPasswordError("");
                              }}
                              disabled={passwordSubmitting}
                              autoComplete="new-password"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-1 block text-sm font-medium text-slate-700"
                              htmlFor="confirmNewPassword"
                            >
                              Confirm new password
                            </label>
                            <input
                              id="confirmNewPassword"
                              type="password"
                              className={inputClass(false)}
                              placeholder="Confirm new password"
                              value={confirmNewPassword}
                              onChange={(e) => {
                                setConfirmNewPassword(e.target.value);
                                setPasswordError("");
                              }}
                              disabled={passwordSubmitting}
                              autoComplete="new-password"
                            />
                          </div>
                        </div>

                        {passwordError && (
                          <p className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle size={16} aria-hidden />
                            {passwordError}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={passwordSubmitting}
                            className={primaryBtnClass}
                            style={{ backgroundColor: "var(--primary, #2b7fff)" }}
                          >
                            {passwordSubmitting ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Save size={18} aria-hidden />
                            )}
                            {passwordSubmitting ? "Updating…" : "Update password"}
                          </button>
                          <button
                            type="button"
                            disabled={passwordSubmitting}
                            onClick={() => {
                              setPasswordStep("request");
                              setOtpCode("");
                              setNewPassword("");
                              setConfirmNewPassword("");
                              setPasswordError("");
                            }}
                            className="inline-flex items-center rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-70"
                          >
                            Back
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </section>
              </ScrollReveal>

              {/* Danger zone */}
              <ScrollReveal variant="fade-up" delay={150}>
              <section aria-labelledby="settings-danger-heading">
                <div className="mb-4 flex items-center gap-2">
                  <Trash2 className="text-red-600" size={20} aria-hidden />
                  <h2
                    id="settings-danger-heading"
                    className="text-lg font-bold text-slate-900"
                  >
                    Danger Zone
                  </h2>
                </div>

                <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                  <div className="border-b border-red-100 bg-red-50/60 px-5 py-4 md:px-6">
                    <h3 className="font-semibold text-red-900">Delete account</h3>
                    <p className="mt-1 text-sm text-red-800/90">
                      Permanently remove your account and all associated data. This
                      action cannot be undone.
                    </p>
                  </div>

                  <div className="space-y-4 p-5 md:p-6">
                    <div className="max-w-md">
                      <label
                        className="mb-1 block text-sm font-medium text-slate-700"
                        htmlFor="deleteAccountPassword"
                      >
                        Confirm with your password
                      </label>
                      <input
                        id="deleteAccountPassword"
                        type="password"
                        className={inputClass(false)}
                        placeholder="Enter your password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        autoComplete="current-password"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={openDeleteModal}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={18} aria-hidden />
                      Delete account
                    </button>
                  </div>
                </div>
              </section>
              </ScrollReveal>
            </div>
          </div>
        </Container>
      </main>

      {toastMessage && (
        <div
          className={`fixed bottom-6 left-1/2 z-[100] max-w-md -translate-x-1/2 rounded-xl border px-5 py-3 text-center text-sm font-medium shadow-lg ${
            toastVariant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {toastMessage}
        </div>
      )}

      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl md:p-6">
            <h3
              id="delete-account-title"
              className="text-lg font-bold text-slate-900"
            >
              Delete your account?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently delete your account. You will be signed out
              and unable to recover your data.
            </p>

            {deleteError && (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={16} aria-hidden />
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteSubmitting}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleteSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
              >
                {deleteSubmitting && (
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                )}
                {deleteSubmitting ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SettingsPage;
