import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  pollNewsQueue,
  pollMarketQueue,
  sendNotificationQueue,
} from "@/lib/queue";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
          _count: { select: { notificationLogs: true } },
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

  return NextResponse.json({
    stats: {
      users: users.length,
      alerts: alerts.length,
      events,
      notifications: logs.length,
    },
    users,
    alerts,
    logs,
    queues: {
      pollNews: newsCounts,
      pollMarket: marketCounts,
      sendNotification: sendCounts,
    },
  });
}
