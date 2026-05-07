import React, { useState, FormEvent } from "react";
import { useAuth } from "../Context/AuthContext";
import { getAxiosErrorMessage } from "../utils/axiosError";

const SettingsPage: React.FC = () => {
  const { user, updateMail, updateUsername, updatePassword } = useAuth();

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

  // --- Change Password ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
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
      await updatePassword(currentPassword, newPassword, confirmNewPassword);
      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(getAxiosErrorMessage(err));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrap">
      <div className="auth-card" style={{ gridTemplateColumns: "1fr", maxWidth: 600 }}>
        <div className="auth-card-right">
          <div className="auth-form" style={{ gap: "2rem" }}>
            <h2 className="auth-form-title">Account Settings</h2>

            {user && (
              <p style={{ textAlign: "center", color: "#555", margin: 0 }}>
                Signed in as <strong>{user.username || user.email}</strong>
              </p>
            )}

            {/* ---- Change Email ---- */}
            <form onSubmit={handleEmailSubmit} style={{ display: "grid", gap: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#333" }}>
                Change Email
              </h3>
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="newEmail">New Email</label>
                <input
                  id="newEmail"
                  type="email"
                  className={`auth-input ${emailError ? "error" : ""}`}
                  placeholder="New email address"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                />
              </div>
              {emailError && <p className="auth-error-msg">{emailError}</p>}
              {emailSuccess && <p className="auth-success-msg">{emailSuccess}</p>}
              <button type="submit" className="auth-btn-primary" disabled={emailSubmitting}>
                {emailSubmitting ? "Updating..." : "Update Email"}
                <span>→</span>
              </button>
            </form>

            <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: 0 }} />

            {/* ---- Change Username ---- */}
            <form onSubmit={handleUsernameSubmit} style={{ display: "grid", gap: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#333" }}>
                Change Username
              </h3>
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="newUsername">New Username</label>
                <input
                  id="newUsername"
                  type="text"
                  className={`auth-input ${usernameError ? "error" : ""}`}
                  placeholder="New username"
                  value={newUsername}
                  onChange={(e) => { setNewUsername(e.target.value); setUsernameError(""); }}
                />
              </div>
              {usernameError && <p className="auth-error-msg">{usernameError}</p>}
              {usernameSuccess && <p className="auth-success-msg">{usernameSuccess}</p>}
              <button type="submit" className="auth-btn-primary" disabled={usernameSubmitting}>
                {usernameSubmitting ? "Updating..." : "Update Username"}
                <span>→</span>
              </button>
            </form>

            <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: 0 }} />

            {/* ---- Change Password ---- */}
            <form onSubmit={handlePasswordSubmit} style={{ display: "grid", gap: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#333" }}>
                Change Password
              </h3>
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  className={`auth-input ${passwordError ? "error" : ""}`}
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); }}
                />
              </div>
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="settingsNewPassword">New Password</label>
                <input
                  id="settingsNewPassword"
                  type="password"
                  className="auth-input"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                />
              </div>
              <div className="auth-input-wrap">
                <label className="auth-label" htmlFor="confirmNewPassword">Confirm New Password</label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  className="auth-input"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordError(""); }}
                />
              </div>
              {passwordError && <p className="auth-error-msg">{passwordError}</p>}
              {passwordSuccess && <p className="auth-success-msg">{passwordSuccess}</p>}
              <button type="submit" className="auth-btn-primary" disabled={passwordSubmitting}>
                {passwordSubmitting ? "Updating..." : "Update Password"}
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
