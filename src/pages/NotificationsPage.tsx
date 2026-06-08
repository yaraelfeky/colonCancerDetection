// import React, { useCallback, useEffect, useState } from "react";
// import Navbar from "../components/Layout/Navbar";
// import Footer from "../components/Layout/Footer";
// import Container from "../components/Layout/Container";
// import {
//   notificationService,
//   type NotificationDto,
// } from "../services/notificationService";
// import { getAxiosErrorMessage } from "../utils/axiosError";
// import {
//   setUnreadNotificationCount,
// } from "../utils/notificationsUnread";
// import { Bell, CheckCheck, Loader2, CalendarCheck, CalendarX, Calendar, Inbox } from "lucide-react";
// import { notificationHub } from "../services/notificationHub";
// import { doctorRequestService } from "../services/doctorRequestService";
// import { doctorResponseService } from "../services/doctorResponseService";
// import type { DoctorRequestDto } from "../types/doctorRequest";
// import { PATIENT_LIST_REFRESH_EVENT } from "../utils/doctorRequestEvents";
// import {
//   addUnreadNotifications,
// } from "../utils/notificationsUnread";
// import ScrollReveal from "../components/ScrollReveal";

// function formatDate(value?: string): string {
//   if (!value) return "—";
//   try {
//     return new Date(value).toLocaleString();
//   } catch {
//     return value;
//   }
// }

// function formatAppointmentDateTime(date?: string, time?: string): string {
//   if (!date && !time) return "—";
//   try {
//     if (date) {
//       const d = new Date(date);
//       const dateStr = d.toLocaleDateString(undefined, {
//         weekday: "long",
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//       });
//       if (time) {
//         const t = time.slice(0, 5);
//         return `${dateStr} at ${t}`;
//       }
//       return dateStr;
//     }
//     return time ?? "—";
//   } catch {
//     return `${date ?? ""} ${time ?? ""}`.trim() || "—";
//   }
// }

// function isUnread(n: NotificationDto): boolean {
//   return !(n.isRead ?? n.read);
// }

// function isAppointmentBookingNotification(n: NotificationDto): boolean {
//   const type = (n.type ?? "").toLowerCase();
//   const title = (n.title ?? "").toLowerCase();
//   const message = (n.message ?? n.body ?? "").toLowerCase();
//   return (
//     type.includes("appointment") ||
//     type.includes("booking") ||
//     title.includes("appointment") ||
//     title.includes("booking") ||
//     message.includes("booked") ||
//     message.includes("appointment request") ||
//     n.appointmentId != null ||
//     n.slotId != null
//   );
// }

// // Extract appointment ID from notification (from explicit field or by parsing message)
// function extractAppointmentId(n: NotificationDto): number | null {
//   if (n.appointmentId) return n.appointmentId;
//   if (n.slotId) return n.slotId;
//   // Try to extract from message like "Appointment ID: 123" or similar
//   const text = n.message ?? n.body ?? n.title ?? "";
//   const match = text.match(/(?:appointment|slot)\s*(?:id|#)?\s*:?\s*(\d+)/i);
//   if (match) return parseInt(match[1]);
//   return null;
// }

// export default function NotificationsPage() {
//   const [activeTab, setActiveTab] = useState<"notifications" | "requests">("notifications");

//   const [notifications, setNotifications] = useState<NotificationDto[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   const [doctorRequests, setDoctorRequests] = useState<DoctorRequestDto[]>([]);
//   const [requestsLoading, setRequestsLoading] = useState(true);
//   const [requestsError, setRequestsError] = useState<string | null>(null);
//   const [requestActionBusy, setRequestActionBusy] = useState<number | null>(null);

//   const [markingId, setMarkingId] = useState<number | null>(null);
//   const [appointmentActionBusy, setAppointmentActionBusy] = useState<number | null>(null);
//   const [appointmentActionDone, setAppointmentActionDone] = useState<Record<number, "approved" | "rejected">>({});
//   const [rejectingId, setRejectingId] = useState<number | null>(null);
//   const [rejectReason, setRejectReason] = useState("");
//   const [toastMsg, setToastMsg] = useState<string | null>(null);

//   useEffect(() => {
//     if (!toastMsg) return;
//     const t = window.setTimeout(() => setToastMsg(null), 4000);
//     return () => window.clearTimeout(t);
//   }, [toastMsg]);

//   const loadRequests = useCallback(async () => {
//     setRequestsLoading(true);
//     setRequestsError(null);
//     try {
//       const data = await doctorRequestService.list();
//       // Filter out completed requests so we only see pending ones
//       setDoctorRequests(data.filter(r => !r.isCompleted));
//     } catch (err) {
//       setRequestsError(getAxiosErrorMessage(err));
//       setDoctorRequests([]);
//     } finally {
//       setRequestsLoading(false);
//     }
//   }, []);

//   const load = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await notificationService.list();
//       setNotifications(data);
//       const unread = data.filter(isUnread).length;
//       setUnreadNotificationCount(unread);
//     } catch (err) {
//       setError(getAxiosErrorMessage(err));
//       setNotifications([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     void load();
//     void loadRequests();
//   }, [load, loadRequests]);

//   useEffect(() => {
//     void notificationHub.start((notification) => {
//       setNotifications((prev) => [notification, ...prev]);
//       addUnreadNotifications(1);
//     });

//     return () => {
//       void notificationHub.stop();
//     };
//   }, []);

//   const handleMarkRead = async (id: number) => {
//     setMarkingId(id);
//     try {
//       await notificationService.markAsRead(id);
//       setNotifications((prev) =>
//         prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n))
//       );
//       setUnreadNotificationCount(
//         notifications.filter((n) => n.id !== id && isUnread(n)).length
//       );
//     } catch (err) {
//       setError(getAxiosErrorMessage(err));
//     } finally {
//       setMarkingId(null);
//     }
//   };

//   const handleMarkAllRead = async () => {
//     setLoading(true);
//     try {
//       await notificationService.markAllAsRead(notifications);
//       setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
//       setUnreadNotificationCount(0);
//     } catch (err) {
//       setError(getAxiosErrorMessage(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApproveRequest = async (requestId: string | number) => {
//     setRequestActionBusy(requestId as number);
//     try {
//       await doctorResponseService.create({
//         patientRequestId: String(requestId),
//         message: "Approved",
//         appointmentSchedule: []
//       });
//       setToastMsg("Request approved successfully.");
//       setDoctorRequests(prev => prev.filter(r => r.id !== requestId && (r as any).patientRequestId !== requestId && (r as any).Id !== requestId));
//       window.dispatchEvent(new Event(PATIENT_LIST_REFRESH_EVENT));
//     } catch (err) {
//       setToastMsg(getAxiosErrorMessage(err) || "Failed to approve request");
//     } finally {
//       setRequestActionBusy(null);
//     }
//   };

//   const handleRejectRequest = async (requestId: string | number) => {
//     setRequestActionBusy(requestId as number);
//     try {
//       // The user requested that rejecting a request deletes it.
//       await doctorRequestService.remove(requestId as number); // assuming remove takes number or string
//       setToastMsg("Request rejected and removed.");
//       setDoctorRequests(prev => prev.filter(r => r.id !== requestId && (r as any).patientRequestId !== requestId && (r as any).Id !== requestId));
//       window.dispatchEvent(new Event(PATIENT_LIST_REFRESH_EVENT));
//     } catch (err) {
//       setToastMsg(getAxiosErrorMessage(err) || "Failed to reject request");
//     } finally {
//       setRequestActionBusy(null);
//     }
//   };

//   const unreadCount = notifications.filter(isUnread).length;

//   return (
//     <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
//       <Navbar />
//       <main className="flex-1 py-10">
//         <Container>
//           <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
//             <div>
//               <h1 className="text-2xl font-extrabold text-gray-900 m-0 mb-1">Notifications & Requests</h1>
//               <p className="text-gray-500 m-0">
//                 {unreadCount > 0 ? `${unreadCount} unread notifications.` : "You're all caught up with notifications."}
//               </p>
//             </div>
//             {unreadCount > 0 && activeTab === "notifications" && (
//               <button
//                 type="button"
//                 onClick={() => void handleMarkAllRead()}
//                 className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
//               >
//                 <CheckCheck size={16} />
//                 Mark all read
//               </button>
//             )}
//           </div>

//           <div className="mb-6 flex gap-2 border-b border-gray-200">
//             <button
//               onClick={() => setActiveTab("notifications")}
//               className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
//                 activeTab === "notifications"
//                   ? "border-blue-600 text-blue-600"
//                   : "border-transparent text-gray-500 hover:text-gray-800"
//               }`}
//             >
//               Notifications
//               {unreadCount > 0 && (
//                 <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
//                   {unreadCount}
//                 </span>
//               )}
//             </button>
//             <button
//               onClick={() => setActiveTab("requests")}
//               className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
//                 activeTab === "requests"
//                   ? "border-blue-600 text-blue-600"
//                   : "border-transparent text-gray-500 hover:text-gray-800"
//               }`}
//             >
//               Patient Requests
//               {doctorRequests.length > 0 && (
//                 <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
//                   {doctorRequests.length}
//                 </span>
//               )}
//             </button>
//           </div>

//           {activeTab === "notifications" && (
//             <>
//               {loading && (
//             <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
//               <Loader2 className="animate-spin" size={20} />
//               Loading notifications…
//             </div>
//           )}

//           {error && !loading && (
//             <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700 mb-4">
//               <p className="m-0 font-medium">{error}</p>
//               <button type="button" onClick={() => void load()} className="mt-3 text-sm underline">
//                 Try again
//               </button>
//             </div>
//           )}

//           {!loading && !error && notifications.length === 0 && (
//             <div className="rounded-2xl bg-white border border-gray-100 p-10 text-center text-gray-400">
//               <Bell size={40} className="mx-auto mb-3 opacity-40" />
//               No notifications right now.
//             </div>
//           )}

//           {!loading && notifications.length > 0 && (
//             <div className="space-y-3">
//               {notifications.map((n, index) => {
//                 const isApptBooking = isAppointmentBookingNotification(n);
//                 const apptId = isApptBooking ? extractAppointmentId(n) : null;
//                 const actionDone = apptId != null ? appointmentActionDone[n.id] : undefined;
//                 const isBusy = appointmentActionBusy === n.id;
//                 const isCurrentlyRejecting = rejectingId === n.id;

//                 return (
//                   <ScrollReveal key={n.id} variant="fade-up" delay={index * 50}>
//                     <article
//                       className={`rounded-2xl border p-5 shadow-sm transition ${
//                         isUnread(n)
//                           ? isApptBooking
//                             ? "bg-white border-blue-200 ring-1 ring-blue-100"
//                             : "bg-white border-blue-100"
//                           : "bg-slate-50 border-gray-100 opacity-80"
//                       }`}
//                     >
//                       <div className="flex flex-wrap items-start justify-between gap-2">
//                         <div className="flex-1 min-w-0">
//                           {/* Appointment booking special header */}
//                           {isApptBooking && (
//                             <div className="flex items-center gap-2 mb-2">
//                               <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
//                                 <Calendar size={16} />
//                               </div>
//                               <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
//                                 Appointment Request
//                               </span>
//                             </div>
//                           )}

//                           {n.title && (
//                             <h2 className="font-semibold text-slate-900 m-0 mb-1">{n.title}</h2>
//                           )}
//                           <p className="text-sm text-slate-700 m-0">{n.message ?? n.body ?? "—"}</p>

//                           {/* Show appointment details if available */}
//                           {isApptBooking && (n.appointmentDate || n.appointmentTime || n.patientName) && (
//                             <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 space-y-1">
//                               {n.patientName && (
//                                 <p className="text-sm text-slate-700">
//                                   <span className="font-semibold text-slate-800">Patient:</span>{" "}
//                                   {n.patientName}
//                                 </p>
//                               )}
//                               {(n.appointmentDate || n.appointmentTime) && (
//                                 <p className="text-sm text-slate-700 flex items-center gap-1">
//                                   <Calendar size={14} className="text-blue-500 shrink-0" />
//                                   <span className="font-semibold text-slate-800">Requested slot:</span>{" "}
//                                   {formatAppointmentDateTime(n.appointmentDate, n.appointmentTime)}
//                                 </p>
//                               )}
//                               {apptId && (
//                                 <p className="text-xs text-slate-400">Appointment ID: {apptId}</p>
//                               )}
//                             </div>
//                           )}

//                           <p className="text-xs text-slate-400 mt-2 m-0">{formatDate(n.createdAt)}</p>
//                         </div>

//                         {isUnread(n) && !isApptBooking && (
//                           <button
//                             type="button"
//                             disabled={markingId === n.id}
//                             onClick={() => void handleMarkRead(n.id)}
//                             className="text-xs text-blue-600 hover:underline disabled:opacity-50 shrink-0"
//                           >
//                             Mark read
//                           </button>
//                         )}
//                       </div>
//                     </article>
//                   </ScrollReveal>
//                 );
//               })}
//             </div>
//           )}
//           </>
//           )}

//           {activeTab === "requests" && (
//             <>
//               {requestsLoading && (
//                 <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
//                   <Loader2 className="animate-spin" size={20} />
//                   Loading patient requests…
//                 </div>
//               )}

//               {requestsError && !requestsLoading && (
//                 <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700 mb-4">
//                   <p className="m-0 font-medium">{requestsError}</p>
//                   <button type="button" onClick={() => void loadRequests()} className="mt-3 text-sm underline">
//                     Try again
//                   </button>
//                 </div>
//               )}

//               {!requestsLoading && !requestsError && doctorRequests.length === 0 && (
//                 <div className="rounded-2xl bg-white border border-gray-100 p-10 text-center text-gray-400">
//                   <Inbox size={40} className="mx-auto mb-3 opacity-40" />
//                   No pending patient requests.
//                 </div>
//               )}

//               {!requestsLoading && doctorRequests.length > 0 && (
//                 <div className="space-y-3">
//                   {doctorRequests.map((req: any, index) => {
//                     const reqId = req.id ?? req.patientRequestId ?? req.requestId ?? req.Id ?? req.PatientRequestId;
//                     const reqSubject = req.subject ?? req.title ?? req.requestType ?? req.Subject ?? req.Title ?? "Patient Request";
//                     const reqMessage = req.message ?? req.requestMessage ?? req.description ?? req.body ?? req.Message ?? req.RequestMessage ?? "";
//                     const reqPatientId = req.patientId ?? req.patientName ?? req.patient ?? req.PatientId ?? req.PatientName ?? "Unknown";
//                     const reqType = req.requestType ?? req.type ?? req.RequestType ?? "General";
//                     const reqDate = req.createdAt ?? req.date ?? req.CreatedAt ?? req.Date;

//                     return (
//                     <ScrollReveal key={reqId || index} variant="fade-up" delay={index * 50}>
//                       <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:shadow-md">
//                         <div className="flex justify-between items-start gap-3">
//                           <div className="flex gap-3">
//                             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
//                               <Inbox size={20} />
//                             </div>
//                             <div>
//                               <h3 className="font-semibold text-gray-900 m-0 text-base">
//                                 {reqSubject}
//                               </h3>
//                               <p className="text-gray-600 mt-1 mb-2 text-sm">
//                                 {reqMessage}
//                               </p>
//                               <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
//                                 <span className="font-medium text-slate-700">Type: {reqType}</span>
//                                 <span>Patient ID: {reqPatientId}</span>
//                                 <span>{formatDate(reqDate)}</span>
//                               </div>
//                             </div>
//                           </div>
//                         </div>

//                         <div className="mt-4 border-t border-slate-100 pt-4 flex flex-wrap gap-2">
//                           <button
//                             type="button"
//                             disabled={requestActionBusy === reqId}
//                             onClick={() => void handleApproveRequest(reqId)}
//                             className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
//                           >
//                             {requestActionBusy === reqId ? (
//                               <Loader2 size={14} className="animate-spin" />
//                             ) : (
//                               <CheckCheck size={14} />
//                             )}
//                             Approve
//                           </button>
//                           <button
//                             type="button"
//                             disabled={requestActionBusy === reqId}
//                             onClick={() => void handleRejectRequest(reqId)}
//                             className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
//                           >
//                             <CalendarX size={14} />
//                             Reject
//                           </button>
//                         </div>
//                       </article>
//                     </ScrollReveal>
//                     );
//                   })}
//                 </div>
//               )}
//             </>
//           )}
//         </Container>
//       </main>

//       {toastMsg && (
//         <div className="fixed bottom-6 left-1/2 z-[100] max-w-sm -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
//           {toastMsg}
//         </div>
//       )}

//       <Footer />
//     </div>
//   );
// }

import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";
import Container from "../components/Layout/Container";
import {
  notificationService,
  type NotificationDto,
} from "../services/notificationService";
import { getAxiosErrorMessage } from "../utils/axiosError";
import { setUnreadNotificationCount, addUnreadNotifications } from "../utils/notificationsUnread";
import {
  Bell, CheckCheck, Loader2,
} from "lucide-react";
import { notificationHub } from "../services/notificationHub";
import ScrollReveal from "../components/ScrollReveal";

function formatDate(value?: string): string {
  if (!value) return "—";
  try { return new Date(value).toLocaleString(); }
  catch { return value; }
}

function isUnread(n: NotificationDto): boolean {
  return !(n.isRead ?? n.read);
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.list();
      setNotifications(data);
      setUnreadNotificationCount(data.filter(isUnread).length);
    } catch (err) {
      setError(getAxiosErrorMessage(err));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    void notificationHub.start((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      addUnreadNotifications(1);
    });
    return () => { void notificationHub.stop(); };
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

  const unreadCount = notifications.filter(isUnread).length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      <Navbar />
      <main className="flex-1 py-10">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 m-0 mb-1">
                Notifications & Requests
              </h1>
              <p className="text-gray-500 m-0">
                {unreadCount > 0
                  ? `${unreadCount} unread notifications.`
                  : "You're all caught up."}
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

          {/* Notifications Section */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="animate-spin" size={20} />
              Loading notifications…
            </div>
          )}
          {error && !loading && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700 mb-4">
              <p className="m-0 font-medium">{error}</p>
              <button type="button" onClick={() => void loadNotifications()}
                className="mt-3 text-sm underline">
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
              {notifications.map((n, index) => (
                <ScrollReveal key={n.id} variant="fade-up" delay={index * 50}>
                  <article
                    className={`rounded-2xl border p-5 shadow-sm transition ${
                      isUnread(n)
                        ? "bg-white border-blue-100"
                        : "bg-slate-50 border-gray-100 opacity-80"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {n.title && (
                          <h2 className="font-semibold text-slate-900 m-0 mb-1">{n.title}</h2>
                        )}
                        <p className="text-sm text-slate-700 m-0">{n.message ?? n.body ?? "—"}</p>
                        <p className="text-xs text-slate-400 mt-2 m-0">{formatDate(n.createdAt)}</p>
                      </div>
                      {isUnread(n) && (
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
                  </article>
                </ScrollReveal>
              ))}
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
