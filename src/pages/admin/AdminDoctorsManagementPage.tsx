import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";
import { getAxiosErrorMessage } from "../../utils/axiosError";
import {
  adminDoctorService,
  type AdminDoctorListItem,
  type AdminDoctorDetails,
} from "../../services/adminDoctorService";

type TabId = "pending" | "approved" ;

const tabLabel: Record<TabId, string> = {
  pending: "Pending Doctors",
  approved: "Approved Doctors",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ──────────────────── Doctor Detail Modal ──────────────────── */

interface DoctorDetailModalProps {
  doctor: AdminDoctorDetails | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}

const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({ doctor, loading, error, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
      }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl bg-white p-6 md:p-8"
        style={{
          maxWidth: 560,
          width: "90%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Doctor Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Loading doctor details…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Details */}
        {!loading && !error && doctor && (
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
            <DetailRow label="Username" value={doctor.userName} />
            <DetailRow label="Email" value={doctor.email} />
            <DetailRow label="Phone" value={doctor.phoneNumber} />
            <DetailRow label="Status" value={doctor.status} />
            <DetailRow label="License" value={doctor.professionalPracticeLicense} />
            <DetailRow label="Issuing Authority" value={doctor.issuingAuthority} />
            <DetailRow label="Registered At"value={formatDate(doctor.registeredAt)}/>
            <DetailRow
              label="Approved At" value={formatDate(doctor.approvedAt)} />
          </div>
        )}

        {/* Close button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex gap-2">
      <span className="min-w-[120px] font-semibold text-slate-700">{label}:</span>
      <span className="break-words">{String(value)}</span>
    </div>
  );
}

/* ──────────────────── Main Page ──────────────────── */

const AdminDoctorsManagementPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<AdminDoctorListItem[]>([]);
  const [approved, setApproved] = useState<AdminDoctorListItem[]>([]);
  const [rejected, setRejected] = useState<AdminDoctorListItem[]>([]);
  const [toast, setToast] = useState<string>("");

  // Detail modal state
  const [detailDoctor, setDetailDoctor] = useState<AdminDoctorDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDoctorId, setRejectDoctorId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
    }),
    [pending.length, approved.length, rejected.length]
  );

  const activeList = useMemo(() => {
    if (tab === "pending") return pending;
    if (tab === "approved") return approved;
    return rejected;
  }, [tab, pending, approved, rejected]);

const loadAll = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const [p, a] = await Promise.all([
      adminDoctorService.getPending(),
      adminDoctorService.getApproved(),
    ]);

    const safeGetItems = (res: any) => res?.items ?? res ?? [];

const pendingItems = safeGetItems(p).map((x: any) => ({
  doctorUserId: x.userId?.toString() ?? "",
  userName: x.userName,
  email: x.email,
  professionalPracticeLicense: x.professionalPracticeLicense,
  issuingAuthority: x.issuingAuthority,
  approvalStatus: x.approvalStatus ?? "Pending",
}));

const approvedItems = safeGetItems(a).map((x: any) => ({
  doctorUserId: x.userId?.toString() ?? "",
  userName: x.userName,
  email: x.email,
  professionalPracticeLicense: x.professionalPracticeLicense,
  issuingAuthority: x.issuingAuthority,
  approvalStatus: x.approvalStatus ?? "Approved",

}));


    setPending(pendingItems);
    setApproved(approvedItems);
    setRejected([]);

  } catch (e) {
    setError(getAxiosErrorMessage(e));
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

const viewDetails = async (doctorUserId: string) => {
  setShowDetailModal(true);
  setDetailDoctor(null);
  setDetailError("");
  setDetailLoading(true);

  try {
    const res = await adminDoctorService.getDetails(doctorUserId);

    setDetailDoctor(res ?? null);
  } catch (e) {
    setDetailError(getAxiosErrorMessage(e));
  } finally {
    setDetailLoading(false);
  }
};

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailDoctor(null);
    setDetailError("");
  };


const approveDoctor = async (doctorUserId: string) => {
  setLoading(true);
  setError("");

  try {
    await adminDoctorService.approve(doctorUserId);

    showToast("Doctor approved successfully.");

    await loadAll(); // refresh
  } catch (e) {
    setError(getAxiosErrorMessage(e));
  } finally {
    setLoading(false);
  }
};

  // const rejectDoctor = async (doctorUserId: string) => {
  //   setLoading(true);
  //   setError("");
  //   try {
  //     await adminDoctorService.reject(doctorUserId);
  //     // Move rejected doctor to local rejected list
  //     const item = pending.find((d) => d.doctorUserId === doctorUserId);
  //     if (item) {
  //       setRejected((prev) => [{ ...item, status: "Rejected" }, ...prev]);
  //     }
  //     showToast("Doctor rejected.");
  //     // Refresh pending/approved lists
  //     await loadAll();
  //   } catch (e) {
  //     const msg = getAxiosErrorMessage(e);
  //     console.error("[AdminDashboard] reject error:", msg, e);
  //     setError(msg);
  //     setLoading(false);
  //   }
  // };

// const rejectDoctor = async (doctorUserId: string) => {
//   setLoading(true);
//   setError("");

//   try {
//     await adminDoctorService.reject(doctorUserId);

//     showToast("Doctor rejected.");

//     await loadAll();
//   } catch (e) {
//     setError(getAxiosErrorMessage(e));
//   } finally {
//     setLoading(false);
//   }
// };

const rejectDoctor = async () => {
  if (!rejectDoctorId) return;

  setLoading(true);
  setError("");

  try {
    await adminDoctorService.reject(
      rejectDoctorId,
      rejectReason
    );

    showToast("Doctor rejected.");

    setRejectDoctorId(null);
    setRejectReason("");

    await loadAll();
  } catch (e) {
    setError(getAxiosErrorMessage(e));
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#002570" }}>
      <Navbar />
      <main className="flex-1" style={{ background: "#F5F7FA" }}>
        <section className="py-8 md:py-10">
          <Container>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-800 md:text-3xl">
                Doctors Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Review doctor applications and manage approvals.
              </p>
            </div>

            {toast && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition">
                {toast}
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div
              className="mb-6 rounded-2xl bg-white p-4"
              style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(tabLabel) as TabId[]).map((id) => {
                    const active = tab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className="rounded-xl px-4 py-2 text-sm font-bold transition"
                        style={
                          active
                            ? {
                                background:
                                  "linear-gradient(135deg, #1E88E5, #26A69A)",
                                color: "white",
                                boxShadow: "0 8px 20px rgba(30,136,229,0.22)",
                              }
                            : {
                                background: "#F1F5F9",
                                color: "#1F2937",
                              }
                        }
                      >
                        {tabLabel[id]}{" "}
                        <span className="opacity-80">({counts[id]})</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={loadAll}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            <div
              className="rounded-2xl bg-white p-5 md:p-6"
              style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}
            >
              <h2 className="text-lg font-bold text-slate-800">{tabLabel[tab]}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {activeList.length} doctor(s)
              </p>

              {loading && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  Loading…
                </div>
              )}

              {!loading && activeList.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No doctors in this section.
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {activeList.map((d) => (
                    <article
                      key={d.doctorUserId}
                      className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-slate-800">
                            Dr\ {d.userName ?? "Doctor"}
                          </h3>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            d.approvalStatus === "Approved"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : d.approvalStatus === "Rejected"
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                          }`}
                        >
                          {d.approvalStatus ?? "Pending"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1 text-sm text-slate-600">
                        <p className="truncate">
                          <span className="font-semibold text-slate-700">Email:</span>{" "}
                          {d.email ?? "—"}
                        </p>
                        <p className="truncate">
                          <span className="font-semibold text-slate-700">userName:</span>{" "}
                          {d.userName ?? "—"}
                        </p>
                        <p className="truncate">
                          <span className="font-semibold text-slate-700">professionalPracticeLicense:</span>{" "}
                          {d.professionalPracticeLicense ?? "__"}
                        </p>
                        <p className="truncate">
                          <span className="font-semibold text-slate-700">issuingAuthority:</span>{" "}
                          {d.issuingAuthority ?? "—"}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {tab === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => approveDoctor(d.doctorUserId)}
                              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              disabled={loading}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectDoctorId(d.doctorUserId);
                                setRejectReason("");
                              }}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                              disabled={loading}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => viewDetails(d.doctorUserId)}
                          className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                        >
                          View Details
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>
      <Footer />

      {/* Detail Modal */}
      {showDetailModal && (
        <DoctorDetailModal
          doctor={detailDoctor}
          loading={detailLoading}
          error={detailError}
          onClose={closeDetailModal}
        />
      )}

      {rejectDoctorId && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onClick={() => setRejectDoctorId(null)}
  >
    <div
      className="w-full max-w-md rounded-2xl bg-white p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="mb-4 text-lg font-bold">
        Reject Doctor
      </h2>

      <textarea
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        placeholder="Write rejection reason..."
        className="min-h-[120px] w-full rounded-xl border border-slate-300 p-3 outline-none"
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => setRejectDoctorId(null)}
          className="rounded-lg border px-4 py-2"
        >
          Cancel
        </button>

        <button
          onClick={rejectDoctor}
          disabled={!rejectReason.trim()}
          className="rounded-lg bg-rose-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  </div>
)}

    </div>
    
  );

};

export default AdminDoctorsManagementPage;
