import React, { useEffect } from "react";
import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";
import Container from "../components/Layout/Container";
import { clearUnreadNotifications } from "../utils/notificationsUnread";

export default function NotificationsPage() {
  useEffect(() => {
    clearUnreadNotifications();
  }, []);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      <Navbar />
      <main className="flex-1 py-10">
        <Container>
          <h1 className="text-2xl font-extrabold text-gray-900 m-0 mb-2">Notifications</h1>
          <p className="text-gray-500 m-0 mb-6">No new notifications right now.</p>
          <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center text-gray-400">
            When messages arrive from your backend, they will appear here. The blue dot on the bell only shows
            while there are unread items.
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
