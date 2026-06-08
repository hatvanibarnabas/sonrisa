import type { Alert, AlertChannel, DetectedEvent } from "@prisma/client";
import type { NotificationChannel } from "./types";

interface SlackConfig {
  webhookUrl?: string;
}

export class SlackChannel implements NotificationChannel {
  validate(config: unknown): string | null {
    if (!config || typeof config !== "object") return "Slack config must be an object";
    const { webhookUrl } = config as SlackConfig;
    const url = webhookUrl ?? process.env.SLACK_WEBHOOK_URL;
    if (!url) return "Slack webhook URL is required (per-alert or SLACK_WEBHOOK_URL env)";
    if (!url.startsWith("https://hooks.slack.com/")) return "Invalid Slack webhook URL";
    return null;
  }

  async send(alert: Alert, channel: AlertChannel, event: DetectedEvent): Promise<void> {
    const config = channel.config as unknown as SlackConfig;
    const webhookUrl = config.webhookUrl ?? process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error("Slack webhook URL not configured");
    }

    const text = [
      `*${alert.name}*`,
      event.title,
      event.summary,
      event.url ? `<${event.url}|Read more>` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Slack webhook failed (${response.status}): ${body}`);
    }
  }
}
