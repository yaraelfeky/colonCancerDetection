import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";
import Container from "../components/Layout/Container";
import {
  notificationService,
  type NotificationDto,
} from "../services/notificationService";
import { getAxiosErrorMessage } from "../utils/axiosError";
import {
  setUnreadNotificationCount,
} from "../utils/notificationsUnread";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { notificationHub } from "../services/notificationHub";
import {
  addUnreadNotifications,
} from "../utils/notificationsUnread";

function formatDate(value?: string): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function isUnread(n: NotificationDto): boolean {
  return !(n.isRead ?? n.read);
}


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);

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
              {notifications.map((n) => (
                <article
                  key={n.id}
                  className={`rounded-2xl border p-5 shadow-sm ${
                    isUnread(n)
                      ? "bg-white border-blue-100"
                      : "bg-slate-50 border-gray-100 opacity-80"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
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
                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
