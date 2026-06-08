import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

export const QUEUE_NAMES = {
  POLL_NEWS: "poll-news",
  POLL_MARKET: "poll-market",
  SEND_NOTIFICATION: "send-notification",
} as const;

const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { connection: getRedisConnection() });
    queues.set(name, queue);
  }
  return queue;
}

export const pollNewsQueue = {
  add: (...args: Parameters<Queue["add"]>) => getQueue(QUEUE_NAMES.POLL_NEWS).add(...args),
  getJobCounts: () => getQueue(QUEUE_NAMES.POLL_NEWS).getJobCounts(),
};

export const pollMarketQueue = {
  add: (...args: Parameters<Queue["add"]>) => getQueue(QUEUE_NAMES.POLL_MARKET).add(...args),
  getJobCounts: () => getQueue(QUEUE_NAMES.POLL_MARKET).getJobCounts(),
};

export const sendNotificationQueue = {
  add: (...args: Parameters<Queue["add"]>) => getQueue(QUEUE_NAMES.SEND_NOTIFICATION).add(...args),
  getJobCounts: () => getQueue(QUEUE_NAMES.SEND_NOTIFICATION).getJobCounts(),
};

export interface SendNotificationJob {
  alertId: string;
  eventId: string;
  channelId: string;
}
