"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AlertChannel {
  id: string;
  type: string;
}

interface Alert {
  id: string;
  name: string;
  isActive: boolean;
  sourceType: string;
  keywords: string[];
  ticker: string | null;
  threshold: number | null;
  channels: AlertChannel[];
  createdAt: string;
}

export function AlertList({ alerts: initial }: { alerts: Alert[] }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleActive(id: string, isActive: boolean) {
    setLoading(id);
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !isActive } : a))
    );
    setLoading(null);
    router.refresh();
  }

  async function deleteAlert(id: string) {
    if (!confirm("Delete this alert?")) return;
    setLoading(id);
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setLoading(null);
    router.refresh();
  }

  if (alerts.length === 0) {
    return (
      <div className="card empty">
        <p>No alerts yet.</p>
        <a href="/alerts/new" className="btn" style={{ marginTop: "1rem" }}>
          Create your first alert
        </a>
      </div>
    );
  }

  return (
    <div>
      {alerts.map((alert) => (
        <div key={alert.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ marginBottom: "0.25rem" }}>{alert.name}</h2>
              <span className={`badge ${alert.isActive ? "badge-active" : "badge-inactive"}`}>
                {alert.isActive ? "Active" : "Paused"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn-secondary"
                disabled={loading === alert.id}
                onClick={() => toggleActive(alert.id, alert.isActive)}
                style={{ padding: "0.4rem 0.8rem" }}
              >
                {alert.isActive ? "Pause" : "Resume"}
              </button>
              <button
                className="btn-danger"
                disabled={loading === alert.id}
                onClick={() => deleteAlert(alert.id)}
                style={{ padding: "0.4rem 0.8rem" }}
              >
                Delete
              </button>
            </div>
          </div>

          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.75rem" }}>
            {alert.sourceType === "NEWS" ? (
              <>Keywords: {alert.keywords.join(", ")}</>
            ) : (
              <>
                Ticker: {alert.ticker} — threshold: {alert.threshold}%
              </>
            )}
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Channels: {alert.channels.map((c) => c.type).join(", ")}
          </p>
        </div>
      ))}
    </div>
  );
}
