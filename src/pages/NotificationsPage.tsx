import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";
import Container from "../components/Layout/Container";
import {
  notificationService,
  type NotificationDto,
} from "../services/notificationService";
import { appointmentService } from "../services/appointmentService";
import { getAxiosErrorMessage } from "../utils/axiosError";
import {
  setUnreadNotificationCount,
} from "../utils/notificationsUnread";
import { Bell, CheckCheck, Loader2, CalendarCheck, CalendarX, Calendar } from "lucide-react";
import { notificationHub } from "../services/notificationHub";
import {
  addUnreadNotifications,
} from "../utils/notificationsUnread";
import ScrollReveal from "../components/ScrollReveal";

function formatDate(value?: string): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatAppointmentDateTime(date?: string, time?: string): string {
  if (!date && !time) return "—";
  try {
    if (date) {
      const d = new Date(date);
      const dateStr = d.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (time) {
        const t = time.slice(0, 5);
        return `${dateStr} at ${t}`;
      }
      return dateStr;
    }
    return time ?? "—";
  } catch {
    return `${date ?? ""} ${time ?? ""}`.trim() || "—";
  }
}

function isUnread(n: NotificationDto): boolean {
  return !(n.isRead ?? n.read);
}

function isAppointmentBookingNotification(n: NotificationDto): boolean {
  const type = (n.type ?? "").toLowerCase();
  const title = (n.title ?? "").toLowerCase();
  const message = (n.message ?? n.body ?? "").toLowerCase();
  return (
    type.includes("appointment") ||
    type.includes("booking") ||
    title.includes("appointment") ||
    title.includes("booking") ||
    message.includes("booked") ||
    message.includes("appointment request") ||
    n.appointmentId != null ||
    n.slotId != null
  );
}

// Extract appointment ID from notification (from explicit field or by parsing message)
function extractAppointmentId(n: NotificationDto): number | null {
  if (n.appointmentId) return n.appointmentId;
  if (n.slotId) return n.slotId;
  // Try to extract from message like "Appointment ID: 123" or similar
  const text = n.message ?? n.body ?? n.title ?? "";
  const match = text.match(/(?:appointment|slot)\s*(?:id|#)?\s*:?\s*(\d+)/i);
  if (match) return parseInt(match[1]);
  return null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [appointmentActionBusy, setAppointmentActionBusy] = useState<number | null>(null);
  const [appointmentActionDone, setAppointmentActionDone] = useState<Record<number, "approved" | "rejected">>({});
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.list();
      setNotifications(data);
      const unread = data.filter(isUnread).length;
      setUnreadNotificationCount(unread);
    } catch (err) {
      setError(getAxiosErrorMessage(err));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void notificationHub.start((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      addUnreadNotifications(1);
    });

    return () => {
      void notificationHub.stop();
    };
  }, []);

  const handleMarkRead = async (id: number) => {
    setMarkingId(id);
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadNotificationCount(
        notifications.filter((n) => n.id !== id && isUnread(n)).length
      );
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await notificationService.markAllAsRead(notifications);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
      setUnreadNotificationCount(0);
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAppointment = async (notifId: number, appointmentId: number) => {
    setAppointmentActionBusy(notifId);
    try {
      await appointmentService.approveAppointment(appointmentId);
      setAppointmentActionDone((prev) => ({ ...prev, [notifId]: "approved" }));
      setToastMsg("Appointment approved successfully!");
      // Mark notification as read
      await notificationService.markAsRead(notifId).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true, read: true } : n))
      );
    } catch (err) {
      setToastMsg(getAxiosErrorMessage(err) || "Failed to approve appointment");
    } finally {
      setAppointmentActionBusy(null);
    }
  };

  const handleRejectAppointment = async (notifId: number, appointmentId: number) => {
    setAppointmentActionBusy(notifId);
    try {
      await appointmentService.rejectAppointment(appointmentId, rejectReason.trim() || undefined);
      setAppointmentActionDone((prev) => ({ ...prev, [notifId]: "rejected" }));
      setRejectingId(null);
      setRejectReason("");
      setToastMsg("Appointment rejected.");
      await notificationService.markAsRead(notifId).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true, read: true } : n))
      );
    } catch (err) {
      setToastMsg(getAxiosErrorMessage(err) || "Failed to reject appointment");
    } finally {
      setAppointmentActionBusy(null);
    }
  };

  const unreadCount = notifications.filter(isUnread).length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      <Navbar />
      <main className="flex-1 py-10">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 m-0 mb-1">Notifications</h1>
              <p className="text-gray-500 m-0">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="animate-spin" size={20} />
              Loading notifications…
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700 mb-4">
              <p className="m-0 font-medium">{error}</p>
              <button type="button" onClick={() => void load()} className="mt-3 text-sm underline">
                Try again
              </button>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="rounded-2xl bg-white border border-gray-100 p-10 text-center text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-40" />
              No notifications right now.
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="space-y-3">
              {notifications.map((n, index) => {
                const isApptBooking = isAppointmentBookingNotification(n);
                const apptId = isApptBooking ? extractAppointmentId(n) : null;
                const actionDone = apptId != null ? appointmentActionDone[n.id] : undefined;
                const isBusy = appointmentActionBusy === n.id;
                const isCurrentlyRejecting = rejectingId === n.id;

                return (
                  <ScrollReveal key={n.id} variant="fade-up" delay={index * 50}>
                    <article
                      className={`rounded-2xl border p-5 shadow-sm transition ${
                        isUnread(n)
                          ? isApptBooking
                            ? "bg-white border-blue-200 ring-1 ring-blue-100"
                            : "bg-white border-blue-100"
                          : "bg-slate-50 border-gray-100 opacity-80"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Appointment booking special header */}
                          {isApptBooking && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Calendar size={16} />
                              </div>
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                                Appointment Request
                              </span>
                            </div>
                          )}

                          {n.title && (
                            <h2 className="font-semibold text-slate-900 m-0 mb-1">{n.title}</h2>
                          )}
                          <p className="text-sm text-slate-700 m-0">{n.message ?? n.body ?? "—"}</p>

                          {/* Show appointment details if available */}
                          {isApptBooking && (n.appointmentDate || n.appointmentTime || n.patientName) && (
                            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 space-y-1">
                              {n.patientName && (
                                <p className="text-sm text-slate-700">
                                  <span className="font-semibold text-slate-800">Patient:</span>{" "}
                                  {n.patientName}
                                </p>
                              )}
                              {(n.appointmentDate || n.appointmentTime) && (
                                <p className="text-sm text-slate-700 flex items-center gap-1">
                                  <Calendar size={14} className="text-blue-500 shrink-0" />
                                  <span className="font-semibold text-slate-800">Requested slot:</span>{" "}
                                  {formatAppointmentDateTime(n.appointmentDate, n.appointmentTime)}
                                </p>
                              )}
                              {apptId && (
                                <p className="text-xs text-slate-400">Appointment ID: {apptId}</p>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-slate-400 mt-2 m-0">{formatDate(n.createdAt)}</p>
                        </div>

                        {isUnread(n) && !isApptBooking && (
                          <button
                            type="button"
                            disabled={markingId === n.id}
                            onClick={() => void handleMarkRead(n.id)}
                            className="text-xs text-blue-600 hover:underline disabled:opacity-50 shrink-0"
                          >
                            Mark read
                          </button>
                        )}
                      </div>

                      {/* Appointment approve/reject actions */}
                      {isApptBooking && apptId != null && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          {actionDone === "approved" ? (
                            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                              <CalendarCheck size={16} />
                              Appointment Approved
                            </div>
                          ) : actionDone === "rejected" ? (
                            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                              <CalendarX size={16} />
                              Appointment Rejected
                            </div>
                          ) : (
                            <>
                              {!isCurrentlyRejecting && (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => void handleApproveAppointment(n.id, apptId)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                                  >
                                    {isBusy ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <CalendarCheck size={14} />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      setRejectingId(n.id);
                                      setRejectReason("");
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
                                  >
                                    <CalendarX size={14} />
                                    Reject
                                  </button>
                                  {isUnread(n) && (
                                    <button
                                      type="button"
                                      disabled={markingId === n.id}
                                      onClick={() => void handleMarkRead(n.id)}
                                      className="ml-auto text-xs text-slate-400 hover:text-slate-600 hover:underline disabled:opacity-50"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                </div>
                              )}

                              {isCurrentlyRejecting && (
                                <div className="space-y-3">
                                  <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Reason for rejection (optional)"
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => void handleRejectAppointment(n.id, apptId)}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                      {isBusy ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <CalendarX size={14} />
                                      )}
                                      Confirm Rejection
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRejectingId(null);
                                        setRejectReason("");
                                      }}
                                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </Container>
      </main>

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 z-[100] max-w-sm -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
          {toastMsg}
        </div>
      )}

      <Footer />
    </div>
  );
}
