export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  pollNewsQueue,
  pollMarketQueue,
  sendNotificationQueue,
} from "@/lib/queue";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/alerts");

  const [users, alerts, logs, events, newsCounts, marketCounts, sendCounts] =
    await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          createdAt: true,
          _count: { select: { alerts: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.alert.findMany({
        include: {
          user: { select: { email: true } },
          channels: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.notificationLog.findMany({
        include: {
          user: { select: { email: true } },
          alert: { select: { name: true } },
          event: { select: { title: true } },
        },
        orderBy: { sentAt: "desc" },
        take: 50,
      }),
      prisma.detectedEvent.count(),
      pollNewsQueue.getJobCounts(),
      pollMarketQueue.getJobCounts(),
      sendNotificationQueue.getJobCounts(),
    ]);

  return (
    <>
      <Nav />
      <div className="container">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">System overview — users, alerts, notifications, job queues</p>

        <div className="stats">
          <div className="stat">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Users</div>
          </div>
          <div className="stat">
            <div className="stat-value">{alerts.length}</div>
            <div className="stat-label">Alerts</div>
          </div>
          <div className="stat">
            <div className="stat-value">{events}</div>
            <div className="stat-label">Events detected</div>
          </div>
          <div className="stat">
            <div className="stat-value">{logs.length}</div>
            <div className="stat-label">Recent notifications</div>
          </div>
        </div>

        <div className="card">
          <h2>Job Queues</h2>
          <table>
            <thead>
              <tr>
                <th>Queue</th>
                <th>Waiting</th>
                <th>Active</th>
                <th>Completed</th>
                <th>Failed</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Poll News", counts: newsCounts },
                { name: "Poll Market", counts: marketCounts },
                { name: "Send Notification", counts: sendCounts },
              ].map((q) => (
                <tr key={q.name}>
                  <td>{q.name}</td>
                  <td>{q.counts.waiting}</td>
                  <td>{q.counts.active}</td>
                  <td>{q.counts.completed}</td>
                  <td>{q.counts.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Users</h2>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Admin</th>
                <th>Alerts</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.isAdmin ? "Yes" : "No"}</td>
                  <td>{u._count.alerts}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>All Alerts</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>User</th>
                <th>Type</th>
                <th>Status</th>
                <th>Channels</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.user.email}</td>
                  <td>{a.sourceType}</td>
                  <td>
                    <span className={`badge ${a.isActive ? "badge-active" : "badge-inactive"}`}>
                      {a.isActive ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td>{a.channels.map((c) => c.type).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Notification Log (last 50)</h2>
          {logs.length === 0 ? (
            <p className="empty">No notifications sent yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Alert</th>
                  <th>Event</th>
                  <th>Channel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.sentAt).toLocaleString()}</td>
                    <td>{log.user.email}</td>
                    <td>{log.alert.name}</td>
                    <td>{log.event.title.slice(0, 40)}...</td>
                    <td>{log.channelType}</td>
                    <td>
                      <span className={`badge badge-${log.status.toLowerCase()}`}>
                        {log.status}
                      </span>
                      {log.error && (
                        <span style={{ color: "var(--danger)", fontSize: "0.75rem", display: "block" }}>
                          {log.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
