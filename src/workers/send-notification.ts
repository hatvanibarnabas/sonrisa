import { Worker, Job } from "bullmq";
import { NotificationStatus } from "@prisma/client";
import { getRedisConnection } from "@/lib/redis";
import { prisma } from "@/lib/db";
import { getChannel } from "@/channels/registry";
import { QUEUE_NAMES, type SendNotificationJob } from "@/lib/queue";

async function processSendNotification(job: Job<SendNotificationJob>): Promise<void> {
  const { alertId, eventId, channelId } = job.data;

  const [alert, event, channel] = await Promise.all([
    prisma.alert.findUnique({ where: { id: alertId } }),
    prisma.detectedEvent.findUnique({ where: { id: eventId } }),
    prisma.alertChannel.findUnique({ where: { id: channelId } }),
  ]);

  if (!alert || !event || !channel) {
    throw new Error(`Missing data: alert=${!!alert} event=${!!event} channel=${!!channel}`);
  }

  const existing = await prisma.notificationLog.findFirst({
    where: { alertId, eventId, channelType: channel.type },
  });
  if (existing) {
    return;
  }

  const handler = getChannel(channel.type);

  try {
    await handler.send(alert, channel, event);
    await prisma.notificationLog.create({
      data: {
        userId: alert.userId,
        alertId,
        eventId,
        channelType: channel.type,
        status: NotificationStatus.SENT,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.notificationLog.create({
      data: {
        userId: alert.userId,
        alertId,
        eventId,
        channelType: channel.type,
        status: NotificationStatus.FAILED,
        error: message,
      },
    });
    throw err;
  }
}

export function createSendNotificationWorker(): Worker<SendNotificationJob> {
  return new Worker<SendNotificationJob>(
    QUEUE_NAMES.SEND_NOTIFICATION,
    processSendNotification,
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  );
}
