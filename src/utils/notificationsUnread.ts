const UNREAD_KEY = "colonai_unread_notifications_count";

export const NOTIFICATIONS_UNREAD_EVENT = "colonai-notifications-unread-changed";

export function getUnreadNotificationCount(): number {
  try {
    const v = localStorage.getItem(UNREAD_KEY);
    if (v == null) return 0;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function dispatchChanged(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_UNREAD_EVENT));
}

export function setUnreadNotificationCount(count: number): void {
  localStorage.setItem(UNREAD_KEY, String(Math.max(0, Math.floor(count))));
  dispatchChanged();
}

/** Call when the user opens the notifications page. */
export function clearUnreadNotifications(): void {
  localStorage.setItem(UNREAD_KEY, "0");
  dispatchChanged();
}

/** When the backend sends a new notification (integrate with your API). */
export function addUnreadNotifications(delta: number): void {
  setUnreadNotificationCount(getUnreadNotificationCount() + delta);
}
