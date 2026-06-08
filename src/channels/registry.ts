// Central registry mapping ChannelType → implementation instance.
// To add a new channel: import it here and add one line.

import { ChannelType } from "@prisma/client";
import type { NotificationChannel } from "./types";
import { EmailChannel } from "./email";
import { SlackChannel } from "./slack";

const registry: Record<ChannelType, NotificationChannel> = {
  [ChannelType.EMAIL]: new EmailChannel(),
  [ChannelType.SLACK]: new SlackChannel(),
};

export function getChannel(type: ChannelType): NotificationChannel {
  const channel = registry[type];
  if (!channel) {
    throw new Error(`No channel implementation registered for type: ${type}`);
  }
  return channel;
}
