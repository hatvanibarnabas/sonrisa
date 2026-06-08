import { Worker, Job } from "bullmq";
import { AlertSourceType } from "@prisma/client";
import { getRedisConnection } from "@/lib/redis";
import { prisma } from "@/lib/db";
import { fetchNewsForKeywords } from "@/services/news-api";
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

async function processPollNews(_job: Job): Promise<void> {
  const alerts = await prisma.alert.findMany({
    where: { isActive: true, sourceType: AlertSourceType.NEWS },
    include: { channels: true },
  });

  if (alerts.length === 0) return;

  const keywordSet = new Set<string>();
  for (const alert of alerts) {
    for (const kw of alert.keywords) keywordSet.add(kw);
  }

  const articles = await fetchNewsForKeywords([...keywordSet]);
  if (articles.length === 0) return;

  for (const article of articles) {
    const event = await prisma.detectedEvent.upsert({
      where: {
        sourceType_externalId: {
          sourceType: AlertSourceType.NEWS,
          externalId: article.externalId,
        },
      },
      create: {
        sourceType: AlertSourceType.NEWS,
        externalId: article.externalId,
        title: article.title,
        summary: article.summary,
        url: article.url,
      },
      update: {},
    });

    const matchingAlerts = alerts.filter((alert) =>
      alert.keywords.some((kw) => {
        const lower = kw.toLowerCase();
        const haystack = `${article.title} ${article.summary ?? ""}`.toLowerCase();
        return haystack.includes(lower);
      })
    );

    for (const alert of matchingAlerts) {
      const alreadySent = await prisma.notificationLog.findFirst({
        where: { alertId: alert.id, eventId: event.id },
      });
      if (!alreadySent) {
        await queueNotifications(alert.id, event.id);
      }
    }
  }
}

export function createPollNewsWorker(): Worker {
  return new Worker(QUEUE_NAMES.POLL_NEWS, processPollNews, {
    connection: getRedisConnection(),
    concurrency: 1,
  });
}
