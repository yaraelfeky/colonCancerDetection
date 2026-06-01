import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";
import ScrollReveal from "../../components/ScrollReveal";
import { useContactManager } from "../../hooks/useContactManager";
import type { ContactEmail, ContactPhone } from "../../types/contact";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";

const PRIMARY = "#0A6EBD";

type ToastVariant = "success" | "error";

interface ToastState {
  message: string;
  variant: ToastVariant;
}

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/30";

const CARD_CLASS =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md md:p-8";

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={`${CARD_CLASS} flex items-center gap-4`}>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
        style={{ background: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
      <CheckCircle2 className="h-3 w-3" />
      Verified
    </span>
  );
}

function PrimaryBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#0A6EBD]/30 bg-[#0A6EBD]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0A6EBD]">
      <Star className="h-3 w-3 fill-current" />
      Primary
    </span>
  );
}

function OtpModal({
  title,
  subtitle,
  otp,
  onOtpChange,
  onVerify,
  onResend,
  onCancel,
  verifying,
  resending,
}: {
  title: string;
  subtitle: React.ReactNode;
  otp: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onCancel: () => void;
  verifying: boolean;
  resending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal
        aria-labelledby="otp-modal-title"
      >
        <h3 id="otp-modal-title" className="text-lg font-bold text-slate-900">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        <div className="mt-4 space-y-4">
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => onOtpChange(e.target.value)}
            className={INPUT_CLASS}
            placeholder="OTP code"
            autoComplete="one-time-code"
            disabled={verifying}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onVerify}
              disabled={verifying || resending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: PRIMARY }}
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify"
              )}
            </button>
            <button
              type="button"
              onClick={onResend}
              disabled={verifying || resending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {resending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Resend Code"
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={verifying || resending}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ContactPage: React.FC = () => {
  const {
    emails,
    phones,
    stats,
    requestAddEmail,
    completeVerifyEmail,
    resendEmailOtp,
    deleteEmail,
    setPrimaryEmail,
    requestAddPhone,
    completeVerifyPhone,
    resendPhoneOtp,
    deletePhone,
    setPrimaryPhone,
  } = useContactManager();

  const [toast, setToast] = useState<ToastState | null>(null);

  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailFieldError, setEmailFieldError] = useState("");
  const [addingEmail, setAddingEmail] = useState(false);
  const addEmailInFlightRef = useRef(false);

  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmailOtp, setResendingEmailOtp] = useState(false);

  const [deleteEmailTarget, setDeleteEmailTarget] = useState<ContactEmail | null>(null);
  const [deletingEmail, setDeletingEmail] = useState(false);
  const [settingPrimaryEmail, setSettingPrimaryEmail] = useState<string | null>(null);

  const [addPhoneOpen, setAddPhoneOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneFieldError, setPhoneFieldError] = useState("");
  const [addingPhone, setAddingPhone] = useState(false);
  const addPhoneInFlightRef = useRef(false);

  const [pendingVerifyPhone, setPendingVerifyPhone] = useState<string | null>(null);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [resendingPhoneOtp, setResendingPhoneOtp] = useState(false);

  const [deletePhoneTarget, setDeletePhoneTarget] = useState<ContactPhone | null>(null);
  const [deletingPhone, setDeletingPhone] = useState(false);
  const [settingPrimaryPhone, setSettingPrimaryPhone] = useState<string | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    setToast({ message, variant });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleAddEmail = async () => {
    if (addingEmail || addEmailInFlightRef.current) return;

    setEmailFieldError("");
    const trimmed = newEmail.trim();
    if (!trimmed) {
      setEmailFieldError("Please enter an email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailFieldError("Please enter a valid email address.");
      return;
    }

    addEmailInFlightRef.current = true;
    setAddingEmail(true);
    try {
      await requestAddEmail(trimmed);
      setPendingVerifyEmail(trimmed);
      setEmailOtp("");
      setAddEmailOpen(false);
      showToast("Verification code sent. Enter the OTP to verify your email.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add email", "error");
    } finally {
      setAddingEmail(false);
      addEmailInFlightRef.current = false;
    }
  };

  const handleVerifyEmail = async () => {
    if (!pendingVerifyEmail || verifyingEmail) return;
    const code = emailOtp.trim();
    if (!code) {
      showToast("Please enter the verification code.", "error");
      return;
    }
    setVerifyingEmail(true);
    try {
      await completeVerifyEmail(pendingVerifyEmail, code);
      setPendingVerifyEmail(null);
      setEmailOtp("");
      showToast("Email verified successfully.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Verification failed", "error");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleResendEmail = async () => {
    if (!pendingVerifyEmail || resendingEmailOtp || verifyingEmail) return;
    setResendingEmailOtp(true);
    try {
      await resendEmailOtp(pendingVerifyEmail);
      showToast("Verification code sent.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to resend code", "error");
    } finally {
      setResendingEmailOtp(false);
    }
  };

  const confirmDeleteEmail = async () => {
    if (!deleteEmailTarget || deletingEmail) return;
    setDeletingEmail(true);
    try {
      await deleteEmail(deleteEmailTarget.email);
      showToast("Email removed.");
      setDeleteEmailTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete email", "error");
    } finally {
      setDeletingEmail(false);
    }
  };

  const handleSetPrimaryEmail = async (email: string) => {
    if (settingPrimaryEmail) return;
    setSettingPrimaryEmail(email);
    try {
      await setPrimaryEmail(email);
      showToast("Primary email updated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to set primary email", "error");
    } finally {
      setSettingPrimaryEmail(null);
    }
  };

  const handleAddPhone = async () => {
    if (addingPhone || addPhoneInFlightRef.current) return;

    setPhoneFieldError("");
    const trimmed = newPhone.trim();
    if (!trimmed) {
      setPhoneFieldError("Please enter a phone number.");
      return;
    }

    addPhoneInFlightRef.current = true;
    setAddingPhone(true);
    try {
      await requestAddPhone(trimmed);
      setPendingVerifyPhone(trimmed);
      setPhoneOtp("");
      setAddPhoneOpen(false);
      showToast("Verification code sent. Enter the OTP to verify your phone number.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add phone", "error");
    } finally {
      setAddingPhone(false);
      addPhoneInFlightRef.current = false;
    }
  };

  const handleVerifyPhone = async () => {
    if (!pendingVerifyPhone || verifyingPhone) return;
    const code = phoneOtp.trim();
    if (!code) {
      showToast("Please enter the verification code.", "error");
      return;
    }
    setVerifyingPhone(true);
    try {
      await completeVerifyPhone(pendingVerifyPhone, code);
      setPendingVerifyPhone(null);
      setPhoneOtp("");
      showToast("Phone number verified successfully.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Verification failed", "error");
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleResendPhone = async () => {
    if (!pendingVerifyPhone || resendingPhoneOtp || verifyingPhone) return;
    setResendingPhoneOtp(true);
    try {
      await resendPhoneOtp(pendingVerifyPhone);
      showToast("Verification code sent.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to resend code", "error");
    } finally {
      setResendingPhoneOtp(false);
    }
  };

  const confirmDeletePhone = async () => {
    if (!deletePhoneTarget || deletingPhone) return;
    setDeletingPhone(true);
    try {
      await deletePhone(deletePhoneTarget.phoneNumber);
      showToast("Phone number removed.");
      setDeletePhoneTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete phone", "error");
    } finally {
      setDeletingPhone(false);
    }
  };

  const handleSetPrimaryPhone = async (phoneNumber: string) => {
    if (settingPrimaryPhone) return;
    setSettingPrimaryPhone(phoneNumber);
    try {
      await setPrimaryPhone(phoneNumber);
      showToast("Primary phone number updated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to set primary phone", "error");
    } finally {
      setSettingPrimaryPhone(null);
    }
  };

  const renderEmailActions = (item: ContactEmail) => (
    <div className="flex flex-wrap gap-2">
      {!item.isPrimary ? (
        <button
          type="button"
          disabled={settingPrimaryEmail !== null}
          onClick={() => void handleSetPrimaryEmail(item.email)}
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
        >
          {settingPrimaryEmail === item.email ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star className="h-3.5 w-3.5" />
          )}
          Make Primary
        </button>
      ) : null}
      <button
        type="button"
        disabled={deletingEmail}
        onClick={() => setDeleteEmailTarget(item)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete Email
      </button>
    </div>
  );

  const renderPhoneActions = (item: ContactPhone) => (
    <div className="flex flex-wrap gap-2">
      {!item.isPrimary ? (
        <button
          type="button"
          disabled={settingPrimaryPhone !== null}
          onClick={() => void handleSetPrimaryPhone(item.phoneNumber)}
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
        >
          {settingPrimaryPhone === item.phoneNumber ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star className="h-3.5 w-3.5" />
          )}
          Make Primary
        </button>
      ) : null}
      <button
        type="button"
        disabled={deletingPhone}
        onClick={() => setDeletePhoneTarget(item)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete Phone
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.variant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      {addEmailOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Add email address</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="new-email" className="text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAddEmail();
                    }
                  }}
                  className={`${INPUT_CLASS} mt-2`}
                  placeholder="you@clinic.com"
                  autoComplete="email"
                  disabled={addingEmail}
                />
                {emailFieldError ? (
                  <p className="mt-2 text-sm text-red-600">{emailFieldError}</p>
                ) : null}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={addingEmail}
                  onClick={() => setAddEmailOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={addingEmail}
                  onClick={() => void handleAddEmail()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                  style={{ background: PRIMARY }}
                >
                  {addingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    "Add Email"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingVerifyEmail ? (
        <OtpModal
          title="Verify email"
          subtitle={
            <>
              Enter the code sent to{" "}
              <span className="font-semibold text-slate-800">{pendingVerifyEmail}</span>
            </>
          }
          otp={emailOtp}
          onOtpChange={setEmailOtp}
          onVerify={() => void handleVerifyEmail()}
          onResend={() => void handleResendEmail()}
          onCancel={() => {
            if (verifyingEmail || resendingEmailOtp) return;
            setPendingVerifyEmail(null);
            setEmailOtp("");
          }}
          verifying={verifyingEmail}
          resending={resendingEmailOtp}
        />
      ) : null}

      {deleteEmailTarget ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete email?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Remove <span className="font-semibold">{deleteEmailTarget.email}</span> from your
              contacts?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deletingEmail}
                onClick={() => setDeleteEmailTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingEmail}
                onClick={() => void confirmDeleteEmail()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deletingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addPhoneOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Add phone number</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="new-phone" className="text-sm font-semibold text-slate-700">
                  Phone number
                </label>
                <input
                  id="new-phone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAddPhone();
                    }
                  }}
                  className={`${INPUT_CLASS} mt-2`}
                  placeholder="+1 555 000 0000"
                  autoComplete="tel"
                  disabled={addingPhone}
                />
                {phoneFieldError ? (
                  <p className="mt-2 text-sm text-red-600">{phoneFieldError}</p>
                ) : null}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={addingPhone}
                  onClick={() => setAddPhoneOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={addingPhone}
                  onClick={() => void handleAddPhone()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                  style={{ background: "#6366F1" }}
                >
                  {addingPhone ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    "Add Phone Number"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingVerifyPhone ? (
        <OtpModal
          title="Verify phone"
          subtitle={
            <>
              Enter the code sent to{" "}
              <span className="font-semibold text-slate-800">{pendingVerifyPhone}</span>
            </>
          }
          otp={phoneOtp}
          onOtpChange={setPhoneOtp}
          onVerify={() => void handleVerifyPhone()}
          onResend={() => void handleResendPhone()}
          onCancel={() => {
            if (verifyingPhone || resendingPhoneOtp) return;
            setPendingVerifyPhone(null);
            setPhoneOtp("");
          }}
          verifying={verifyingPhone}
          resending={resendingPhoneOtp}
        />
      ) : null}

      {deletePhoneTarget ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete phone number?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Remove <span className="font-semibold">{deletePhoneTarget.phoneNumber}</span> from
              your contacts?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deletingPhone}
                onClick={() => setDeletePhoneTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingPhone}
                onClick={() => void confirmDeletePhone()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deletingPhone ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="flex-1 pb-12">
        <section className="border-b border-slate-200 bg-white shadow-sm">
          <Container>
            <ScrollReveal variant="fade-up" delay={50}>
              <div className="py-8">
                <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                  Contact Management
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Manage your email addresses and phone numbers used for account communication
                  and verification.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </section>

        <Container>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Emails"
              value={stats.totalEmails}
              icon={<Mail className="h-5 w-5" />}
              accent={PRIMARY}
            />
            <StatCard
              label="Verified Emails"
              value={stats.verifiedEmails}
              icon={<CheckCircle2 className="h-5 w-5" />}
              accent="#26A69A"
            />
            <StatCard
              label="Total Phone Numbers"
              value={stats.totalPhones}
              icon={<Phone className="h-5 w-5" />}
              accent="#6366F1"
            />
            <StatCard
              label="Verified Phone Numbers"
              value={stats.verifiedPhones}
              icon={<ShieldCheck className="h-5 w-5" />}
              accent="#F59E0B"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
            <ScrollReveal variant="fade-up" delay={80}>
              <section className={CARD_CLASS}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md"
                      style={{ background: PRIMARY }}
                    >
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 m-0">Email Management</h2>
                      <p className="text-sm text-slate-500 m-0 mt-0.5">
                        Add and verify email addresses for your account.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!!pendingVerifyEmail || addingEmail}
                    onClick={() => {
                      setEmailFieldError("");
                      setNewEmail("");
                      setAddEmailOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                    style={{ background: PRIMARY }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Email
                  </button>
                </div>

                <div className="mt-6">
                  {emails.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <Mail className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 font-semibold text-slate-600 m-0">
                        No verified email addresses yet.
                      </p>
                      <p className="mt-1 text-sm text-slate-500 m-0">
                        Add an email and complete OTP verification to see it here.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {emails.map((item) => (
                        <li
                          key={item.email}
                          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                        >
                          <p className="font-semibold text-slate-900 break-all m-0">{item.email}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <VerifiedBadge />
                            {item.isPrimary ? <PrimaryBadge /> : null}
                          </div>
                          <div className="mt-3">{renderEmailActions(item)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={120}>
              <section className={CARD_CLASS}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md"
                      style={{ background: "#6366F1" }}
                    >
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 m-0">
                        Phone Management
                      </h2>
                      <p className="text-sm text-slate-500 m-0 mt-0.5">
                        Add and verify phone numbers for SMS and account alerts.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!!pendingVerifyPhone || addingPhone}
                    onClick={() => {
                      setPhoneFieldError("");
                      setNewPhone("");
                      setAddPhoneOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                    style={{ background: "#6366F1" }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Phone Number
                  </button>
                </div>

                <div className="mt-6">
                  {phones.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <Phone className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 font-semibold text-slate-600 m-0">
                        No verified phone numbers yet.
                      </p>
                      <p className="mt-1 text-sm text-slate-500 m-0">
                        Add a phone number and complete OTP verification to see it here.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {phones.map((item) => (
                        <li
                          key={item.phoneNumber}
                          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                        >
                          <p className="font-semibold text-slate-900 break-all m-0">
                            {item.phoneNumber}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <VerifiedBadge />
                            {item.isPrimary ? <PrimaryBadge /> : null}
                          </div>
                          <div className="mt-3">{renderPhoneActions(item)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </ScrollReveal>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
