// The core abstraction that makes channels extensible.
// Every channel (Email, Slack, future SMS etc.) implements this interface.
// See DECISION_LOG.md section 2.2 for why this design was chosen.

import type { Alert, AlertChannel, DetectedEvent } from "@prisma/client";

export interface NotificationChannel {
  /**
   * Send a notification for a triggered alert.
   * Throws on failure — the caller (BullMQ worker) handles retries.
   */
  send(
    alert: Alert,
    channel: AlertChannel,
    event: DetectedEvent
  ): Promise<void>;

  /**
   * Validate channel config before saving to DB.
   * Returns an error message string, or null if valid.
   */
  validate(config: unknown): string | null;
}
