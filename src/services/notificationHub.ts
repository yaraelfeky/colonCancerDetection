import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "../api/axiosInstance";
import type { NotificationDto } from "./notificationService";

const HUB_URL = `${API_BASE_URL.replace(/\/$/, "")}/hubs/notifications`;

class NotificationHubService {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private listeners: Array<(notification: NotificationDto) => void> = [];

  addListener(onReceive: (notification: NotificationDto) => void) {
    if (!this.listeners.includes(onReceive)) {
      this.listeners.push(onReceive);
    }
  }

  removeListener(onReceive: (notification: NotificationDto) => void) {
    this.listeners = this.listeners.filter((l) => l !== onReceive);
  }

  // Backward compatibility for components that just use start(cb)
  start(onReceive?: (notification: NotificationDto) => void): Promise<void> {
    if (onReceive) {
      this.addListener(onReceive);
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    if (this.connection) {
      return Promise.resolve();
    }

    // Temporarily disabled to prevent "Connect via" proxy HTML from crashing SignalR's internal transport
    console.warn("SignalR connection temporarily disabled to prevent handshake crash.");
    this.startPromise = Promise.resolve();
    return this.startPromise;
  }

  async stop(): Promise<void> {
    if (!this.connection) return;
    await this.connection.stop();
    this.connection = null;
  }
}

export const notificationHub = new NotificationHubService();
