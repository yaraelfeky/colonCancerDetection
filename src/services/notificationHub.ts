import * as signalR from "@microsoft/signalr";

const HUB_URL = "https://clinical.runasp.net/hubs/notifications";

class NotificationHubService {
  private connection: signalR.HubConnection | null = null;

  async start(onReceive: (notification: any) => void) {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => {
          return localStorage.getItem("token") || "";
        },
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on("ReceiveNotification", (data) => {
      console.log("notification received", data);

      onReceive(data);
    });

    try {
      await this.connection.start();

      console.log("SignalR connected");
    } catch (err) {
      console.error("SignalR connection error:", err);
    }
  }

  async stop() {
    if (!this.connection) return;

    await this.connection.stop();

    this.connection = null;
  }
}

export const notificationHub = new NotificationHubService();