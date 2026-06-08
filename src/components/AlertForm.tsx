"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SourceType = "NEWS" | "MARKET";
type ChannelType = "EMAIL" | "SLACK";

export function AlertForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("NEWS");
  const [keywords, setKeywords] = useState("");
  const [ticker, setTicker] = useState("BTC-USD");
  const [threshold, setThreshold] = useState("5");
  const [emailTo, setEmailTo] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [useEmail, setUseEmail] = useState(true);
  const [useSlack, setUseSlack] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const channels: Array<{ type: ChannelType; config: Record<string, string> }> = [];
    if (useEmail) channels.push({ type: "EMAIL", config: { to: emailTo } });
    if (useSlack) {
      const config: Record<string, string> = {};
      if (slackWebhook) config.webhookUrl = slackWebhook;
      channels.push({ type: "SLACK", config });
    }

    const body = {
      name,
      sourceType,
      keywords: sourceType === "NEWS" ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
      ticker: sourceType === "MARKET" ? ticker : undefined,
      threshold: sourceType === "MARKET" ? parseFloat(threshold) : undefined,
      channels,
    };

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create alert");
        return;
      }
      router.push("/alerts");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>New Alert</h2>
      {error && <p className="error">{error}</p>}

      <label htmlFor="name">Alert name</label>
      <input
        id="name"
        required
        placeholder="e.g. Earthquake news"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label htmlFor="sourceType">Source type</label>
      <select
        id="sourceType"
        value={sourceType}
        onChange={(e) => setSourceType(e.target.value as SourceType)}
      >
        <option value="NEWS">Breaking news (keywords)</option>
        <option value="MARKET">Market movement (ticker)</option>
      </select>

      {sourceType === "NEWS" ? (
        <>
          <label htmlFor="keywords">Keywords (comma-separated)</label>
          <input
            id="keywords"
            required
            placeholder="earthquake, tsunami, flood"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </>
      ) : (
        <div className="form-row">
          <div>
            <label htmlFor="ticker">Ticker</label>
            <input
              id="ticker"
              required
              placeholder="BTC-USD, AAPL"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="threshold">Threshold (% change)</label>
            <input
              id="threshold"
              type="number"
              required
              min="0.1"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>
        </div>
      )}

      <h2 style={{ marginTop: "1rem" }}>Notification channels</h2>

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <input
          type="checkbox"
          checked={useEmail}
          onChange={(e) => setUseEmail(e.target.checked)}
          style={{ width: "auto", margin: 0 }}
        />
        Email
      </label>
      {useEmail && (
        <>
          <label htmlFor="emailTo">Email address</label>
          <input
            id="emailTo"
            type="email"
            required={useEmail}
            placeholder="you@example.com"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />
        </>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <input
          type="checkbox"
          checked={useSlack}
          onChange={(e) => setUseSlack(e.target.checked)}
          style={{ width: "auto", margin: 0 }}
        />
        Slack
      </label>
      {useSlack && (
        <>
          <label htmlFor="slackWebhook">Slack webhook URL (optional if set in env)</label>
          <input
            id="slackWebhook"
            placeholder="https://hooks.slack.com/services/..."
            value={slackWebhook}
            onChange={(e) => setSlackWebhook(e.target.value)}
          />
        </>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button type="submit" disabled={loading || (!useEmail && !useSlack)}>
          {loading ? "Creating..." : "Create alert"}
        </button>
        <a href="/alerts" className="btn btn-secondary">
          Cancel
        </a>
      </div>
    </form>
  );
}
