import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "../api/axiosInstance";
import type { NotificationDto } from "./notificationService";

const HUB_URL = `${API_BASE_URL.replace(/\/$/, "")}/hubs/notifications`;

class NotificationHubService {
  private connection: signalR.HubConnection | null = null;

  async start(onReceive: (notification: NotificationDto) => void): Promise<void> {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on("ReceiveNotification", (data: NotificationDto) => {
      onReceive(data);
    });

    try {
      await this.connection.start();
    } catch (err) {
      console.error("SignalR connection error:", err);
    }
  }

  async stop(): Promise<void> {
    if (!this.connection) return;
    await this.connection.stop();
    this.connection = null;
  }
}

export const notificationHub = new NotificationHubService();
