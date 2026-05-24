import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";
import Container from "../components/Layout/Container";
import { inboxService, type InboxItemDto } from "../services/inboxService";
import { getAxiosErrorMessage } from "../utils/axiosError";
import { Mail, Inbox, Loader2 } from "lucide-react";

function formatDate(value?: string): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function itemSubject(item: InboxItemDto): string {
  return item.subject ?? item.type?.slice(0, 80) ?? "Message";
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inboxService.list();
      setItems(data);
    } catch (err) {
      setError(getAxiosErrorMessage(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      <Navbar />
      <main className="flex-1 py-10">
        <Container>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Inbox size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 m-0">Inbox</h1>
              <p className="text-gray-500 m-0 text-sm">Requests and responses between doctors and patients.</p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="animate-spin" size={20} />
              Loading inbox…
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700 mb-4">
              <p className="m-0 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="rounded-2xl bg-white border border-gray-100 p-10 text-center text-gray-400">
              <Mail size={40} className="mx-auto mb-3 opacity-40" />
              No messages in your inbox yet.
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:border-blue-100 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <h2 className="font-semibold text-slate-900 m-0">{itemSubject(item)}</h2>
                    <span className="text-xs text-slate-400">{formatDate(item.createdAt ?? item.sentAt)}</span>
                  </div>
                  {(item.senderName ?? item.fromUserName) && (
                    <p className="text-sm text-slate-500 m-0 mb-2">
                      From: {item.senderName ?? item.fromUserName}
                    </p>
                  )}
                  <p className="text-sm text-slate-700 m-0 whitespace-pre-wrap">
                    {item.message ?? item.body ?? "—"}
                  </p>
                  {item.type && (
                    <span className="inline-block mt-3 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      {item.type}
                    </span>
                  )}
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
