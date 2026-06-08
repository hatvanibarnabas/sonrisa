import { pollNewsQueue, pollMarketQueue } from "@/lib/queue";
import { createPollNewsWorker } from "./poll-news";
import { createPollMarketWorker } from "./poll-market";
import { createSendNotificationWorker } from "./send-notification";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function scheduleRecurringJobs(): Promise<void> {
  await pollNewsQueue.add(
    "poll",
    {},
    { repeat: { every: POLL_INTERVAL_MS }, jobId: "poll-news-recurring" }
  );
  await pollMarketQueue.add(
    "poll",
    {},
    { repeat: { every: POLL_INTERVAL_MS }, jobId: "poll-market-recurring" }
  );
  console.log(`[Worker] Scheduled polling every ${POLL_INTERVAL_MS / 1000}s`);
}

async function main(): Promise<void> {
  const pollNewsWorker = createPollNewsWorker();
  const pollMarketWorker = createPollMarketWorker();
  const sendWorker = createSendNotificationWorker();

  pollNewsWorker.on("failed", (job, err) =>
    console.error(`[PollNews] Job ${job?.id} failed:`, err.message)
  );
  pollMarketWorker.on("failed", (job, err) =>
    console.error(`[PollMarket] Job ${job?.id} failed:`, err.message)
  );
  sendWorker.on("failed", (job, err) =>
    console.error(`[SendNotification] Job ${job?.id} failed:`, err.message)
  );

  await scheduleRecurringJobs();

  // Run once immediately on startup
  await pollNewsQueue.add("poll-initial", {});
  await pollMarketQueue.add("poll-initial", {});

  console.log("[Worker] All workers started");
}

main().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});
