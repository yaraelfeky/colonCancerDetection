import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";
import { getAxiosErrorMessage } from "../../utils/axiosError";
import {
  adminDoctorService,
  type AdminDoctorListItem,
} from "../../services/adminDoctorService";

type TabId = "pending" | "approved" | "rejected";

const tabLabel: Record<TabId, string> = {
  pending: "Pending Doctors",
  approved: "Approved Doctors",
  rejected: "Rejected Doctors",
};

function normalize(item: AdminDoctorListItem, status: AdminDoctorListItem["status"]): AdminDoctorListItem {
  return {
    ...item,
    status: item.status ?? status,
    doctorUserId: item.doctorUserId ?? (item as unknown as { id?: string }).id ?? "",
  };
}

const AdminDoctorsManagementPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<AdminDoctorListItem[]>([]);
  const [approved, setApproved] = useState<AdminDoctorListItem[]>([]);
  const [rejected, setRejected] = useState<AdminDoctorListItem[]>([]);
  const [toast, setToast] = useState<string>("");

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

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, a] = await Promise.all([
        adminDoctorService.getPending(),
        adminDoctorService.getApproved(),
      ]);
      setPending(p.map((x) => normalize(x, "Pending")));
      setApproved(a.map((x) => normalize(x, "Approved")));
      // Backend does not provide rejected list endpoint in requirements; keep local-only rejected.
      setRejected((prev) => prev.map((x) => normalize(x, "Rejected")));
    } catch (e) {
      setError(getAxiosErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const approveDoctor = async (doctorUserId: string) => {
    setLoading(true);
    setError("");
    try {
      await adminDoctorService.approve(doctorUserId);
      const item = pending.find((d) => d.doctorUserId === doctorUserId);
      setPending((prev) => prev.filter((d) => d.doctorUserId !== doctorUserId));
      if (item) setApproved((prev) => [{ ...item, status: "Approved" }, ...prev]);
      showToast("Doctor approved.");
    } catch (e) {
      setError(getAxiosErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const rejectDoctor = async (doctorUserId: string) => {
    setLoading(true);
    setError("");
    try {
      await adminDoctorService.reject(doctorUserId);
      const item = pending.find((d) => d.doctorUserId === doctorUserId);
      setPending((prev) => prev.filter((d) => d.doctorUserId !== doctorUserId));
      if (item) setRejected((prev) => [{ ...item, status: "Rejected" }, ...prev]);
      showToast("Doctor rejected.");
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
                Admin Dashboard · Doctors Management
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
                            {d.fullName ?? "Doctor"}
                          </h3>
                          <p className="truncate text-sm text-slate-500">
                            {d.specialty ?? "—"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            d.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : d.status === "Rejected"
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                          }`}
                        >
                          {d.status ?? "Pending"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1 text-sm text-slate-600">
                        <p className="truncate">
                          <span className="font-semibold text-slate-700">Email:</span>{" "}
                          {d.email ?? "—"}
                        </p>
                        <p className="truncate">
                          <span className="font-semibold text-slate-700">Phone:</span>{" "}
                          {d.phoneNumber ?? "—"}
                        </p>
                      </div>

                      {tab === "pending" && (
                        <div className="mt-4 flex flex-wrap gap-2">
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
                            onClick={() => rejectDoctor(d.doctorUserId)}
                            className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDoctorsManagementPage;

