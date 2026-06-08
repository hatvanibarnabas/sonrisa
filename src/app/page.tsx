import Link from "next/link";
import { Nav } from "@/components/Nav";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  return (
    <>
      <Nav />
      <div className="container">
        <h1>World Event Alerts</h1>
        <p className="subtitle">
          Get notified when something important happens — breaking news, market
          movements, natural disasters.
        </p>

        {session ? (
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/alerts" className="btn">
              My Alerts
            </Link>
            {session.isAdmin && (
              <Link href="/admin" className="btn btn-secondary">
                Admin Dashboard
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/register" className="btn">
              Get started
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>
        )}

        <div className="card" style={{ marginTop: "2rem" }}>
          <h2>How it works</h2>
          <ol style={{ paddingLeft: "1.25rem", color: "var(--muted)" }}>
            <li>Create an alert with keywords (news) or a ticker + threshold (markets)</li>
            <li>Choose Email and/or Slack as notification channels</li>
            <li>Background workers poll sources every 5 minutes</li>
            <li>When a match is found, you get notified</li>
          </ol>
        </div>
      </div>
    </>
  );
}
