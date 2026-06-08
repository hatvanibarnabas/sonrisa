import { Worker, Job } from "bullmq";
import { AlertSourceType } from "@prisma/client";
import { getRedisConnection } from "@/lib/redis";
import { prisma } from "@/lib/db";
import { checkMarketMovement } from "@/services/market-api";
import { sendNotificationQueue } from "@/lib/queue";
import { QUEUE_NAMES } from "@/lib/queue";

async function queueNotifications(alertId: string, eventId: string): Promise<void> {
  const channels = await prisma.alertChannel.findMany({ where: { alertId } });
  for (const channel of channels) {
    await sendNotificationQueue.add("send", {
      alertId,
      eventId,
      channelId: channel.id,
    });
  }
}

async function processPollMarket(_job: Job): Promise<void> {
  const alerts = await prisma.alert.findMany({
    where: { isActive: true, sourceType: AlertSourceType.MARKET },
    include: { channels: true },
  });

  for (const alert of alerts) {
    if (!alert.ticker || alert.threshold == null) continue;

    try {
      const movement = await checkMarketMovement(alert.ticker, alert.threshold);
      if (!movement) continue;

      const event = await prisma.detectedEvent.upsert({
        where: {
          sourceType_externalId: {
            sourceType: AlertSourceType.MARKET,
            externalId: movement.externalId,
          },
        },
        create: {
          sourceType: AlertSourceType.MARKET,
          externalId: movement.externalId,
          title: movement.title,
          summary: movement.summary,
          url: movement.url,
        },
        update: {},
      });

      const alreadySent = await prisma.notificationLog.findFirst({
        where: { alertId: alert.id, eventId: event.id },
      });
      if (!alreadySent) {
        await queueNotifications(alert.id, event.id);
      }
    } catch (err) {
      console.error(`[PollMarket] Failed for alert ${alert.id}:`, err);
    }
  }
}

export function createPollMarketWorker(): Worker {
  return new Worker(QUEUE_NAMES.POLL_MARKET, processPollMarket, {
    connection: getRedisConnection(),
    concurrency: 1,
  });
}
