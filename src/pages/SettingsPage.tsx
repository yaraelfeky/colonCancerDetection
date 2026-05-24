import React, { useState, FormEvent } from "react";
import { useAuth } from "../Context/AuthContext";
import { getAxiosErrorMessage } from "../utils/axiosError";
import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";
import Container from "../components/Layout/Container";
import { Mail, User, Lock, Save, AlertCircle, CheckCircle2 } from "lucide-react";

const SettingsPage: React.FC = () => {
  const { user, updateMail, updateUsername, requestPasswordChange, confirmPasswordChange } = useAuth();

  // --- Change Email ---
  const [newEmail, setNewEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");

    if (!newEmail.trim()) {
      setEmailError("Please enter a new email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailSubmitting(true);
    try {
      await updateMail(newEmail.trim());
      setEmailSuccess("Email updated successfully.");
      setNewEmail("");
    } catch (err) {
      setEmailError(getAxiosErrorMessage(err));
    } finally {
      setEmailSubmitting(false);
    }
  };

  // --- Change Username ---
  const [newUsername, setNewUsername] = useState("");
  const [usernameSubmitting, setUsernameSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");

  const handleUsernameSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");

    if (!newUsername.trim()) {
      setUsernameError("Please enter a new username.");
      return;
    }

    setUsernameSubmitting(true);
    try {
      await updateUsername(newUsername.trim());
      setUsernameSuccess("Username updated successfully.");
      setNewUsername("");
    } catch (err) {
      setUsernameError(getAxiosErrorMessage(err));
    } finally {
      setUsernameSubmitting(false);
    }
  };

  // --- Change Password (OTP flow) ---
  const [passwordStep, setPasswordStep] = useState<"request" | "confirm">("request");
  const [currentPassword, setCurrentPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const resetPasswordForm = () => {
    setPasswordStep("request");
    setCurrentPassword("");
    setOtpCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handlePasswordRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await requestPasswordChange(currentPassword);
      setPasswordStep("confirm");
      setPasswordSuccess("Verification code sent to your email. Enter it below with your new password.");
    } catch (err) {
      setPasswordError(getAxiosErrorMessage(err));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handlePasswordConfirm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!otpCode.trim()) {
      setPasswordError("Please enter the verification code from your email.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await confirmPasswordChange(otpCode.trim(), newPassword, confirmNewPassword);
      setPasswordSuccess("Password updated successfully.");
      resetPasswordForm();
    } catch (err) {
      setPasswordError(getAxiosErrorMessage(err));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 py-10">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Account Settings</h1>
            {user && (
              <p className="text-slate-500 mb-8">
                Manage your account preferences and settings. Signed in as <strong className="text-slate-700">{user.username || user.email}</strong>.
              </p>
            )}

            <div className="space-y-6">
              {/* Email Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Change Email</h3>
                    <p className="text-sm text-slate-500">Update your account's email address.</p>
                  </div>
                </div>
                <div className="p-6">
                  <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="newEmail">New Email</label>
                      <input
                        id="newEmail"
                        type="email"
                        className={`w-full px-4 py-2.5 rounded-xl border ${emailError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'} text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2`}
                        placeholder="Enter new email address"
                        value={newEmail}
                        onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                      />
                    </div>

                    {emailError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle size={16} />
                        <span>{emailError}</span>
                      </div>
                    )}
                    {emailSuccess && (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm">
                        <CheckCircle2 size={16} />
                        <span>{emailSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={emailSubmitting}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Save size={18} />
                      {emailSubmitting ? "Updating..." : "Update Email"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Username Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Change Username</h3>
                    <p className="text-sm text-slate-500">Update your display name.</p>
                  </div>
                </div>
                <div className="p-6">
                  <form onSubmit={handleUsernameSubmit} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="newUsername">New Username</label>
                      <input
                        id="newUsername"
                        type="text"
                        className={`w-full px-4 py-2.5 rounded-xl border ${usernameError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'} text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2`}
                        placeholder="Enter new username"
                        value={newUsername}
                        onChange={(e) => { setNewUsername(e.target.value); setUsernameError(""); }}
                      />
                    </div>

                    {usernameError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle size={16} />
                        <span>{usernameError}</span>
                      </div>
                    )}
                    {usernameSuccess && (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm">
                        <CheckCircle2 size={16} />
                        <span>{usernameSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={usernameSubmitting}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Save size={18} />
                      {usernameSubmitting ? "Updating..." : "Update Username"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Change Password</h3>
                    <p className="text-sm text-slate-500">
                      {passwordStep === "request"
                        ? "Verify your current password to receive a one-time code by email."
                        : "Enter the code from your email and choose a new password."}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  {passwordStep === "request" ? (
                    <form onSubmit={handlePasswordRequest} className="space-y-5 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="currentPassword">Current Password</label>
                        <input
                          id="currentPassword"
                          type="password"
                          className={`w-full px-4 py-2.5 rounded-xl border ${passwordError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'} text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2`}
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); }}
                        />
                      </div>

                      {passwordError && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle size={16} />
                          <span>{passwordError}</span>
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm">
                          <CheckCircle2 size={16} />
                          <span>{passwordSuccess}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={passwordSubmitting}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                      >
                        <Save size={18} />
                        {passwordSubmitting ? "Sending..." : "Send Verification Code"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handlePasswordConfirm} className="space-y-5 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="otpCode">Verification Code</label>
                        <input
                          id="otpCode"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          className={`w-full px-4 py-2.5 rounded-xl border ${passwordError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'} text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2`}
                          placeholder="Code from email"
                          value={otpCode}
                          onChange={(e) => { setOtpCode(e.target.value); setPasswordError(""); }}
                        />
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="settingsNewPassword">New Password</label>
                          <input
                            id="settingsNewPassword"
                            type="password"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="confirmNewPassword">Confirm Password</label>
                          <input
                            id="confirmNewPassword"
                            type="password"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Confirm new password"
                            value={confirmNewPassword}
                            onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordError(""); }}
                          />
                        </div>
                      </div>

                      {passwordError && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle size={16} />
                          <span>{passwordError}</span>
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm">
                          <CheckCircle2 size={16} />
                          <span>{passwordSuccess}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={passwordSubmitting}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                        >
                          <Save size={18} />
                          {passwordSubmitting ? "Updating..." : "Update Password"}
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
                            setPasswordSuccess("");
                          }}
                          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-70"
                        >
                          Back
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage;
