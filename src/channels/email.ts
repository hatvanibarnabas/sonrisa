import nodemailer from "nodemailer";
import type { Alert, AlertChannel, DetectedEvent } from "@prisma/client";
import type { NotificationChannel } from "./types";

interface EmailConfig {
  to: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export class EmailChannel implements NotificationChannel {
  validate(config: unknown): string | null {
    if (!config || typeof config !== "object") return "Email config must be an object";
    const { to } = config as EmailConfig;
    if (!to || typeof to !== "string") return "Email address (to) is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return "Invalid email address";
    return null;
  }

  async send(alert: Alert, channel: AlertChannel, event: DetectedEvent): Promise<void> {
    const config = channel.config as unknown as EmailConfig;
    const transporter = getTransporter();

    if (!transporter) {
      console.warn(
        `[EmailChannel] SMTP not configured — would send to ${config.to}: ${event.title}`
      );
      return;
    }

    const body = [
      `Alert: ${alert.name}`,
      "",
      event.title,
      event.summary ?? "",
      event.url ? `\nRead more: ${event.url}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "alerts@localhost",
      to: config.to,
      subject: `[Alert] ${alert.name}: ${event.title}`,
      text: body,
    });
  }
}
