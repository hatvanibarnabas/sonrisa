import { z } from "zod";
import { AlertSourceType, ChannelType } from "@prisma/client";
import { getChannel } from "@/channels/registry";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const channelConfigSchema = z.object({
  type: z.nativeEnum(ChannelType),
  config: z.record(z.unknown()),
});

export const createAlertSchema = z
  .object({
    name: z.string().min(1).max(100),
    sourceType: z.nativeEnum(AlertSourceType),
    keywords: z.array(z.string()).optional(),
    ticker: z.string().optional(),
    threshold: z.number().positive().optional(),
    channels: z.array(channelConfigSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.sourceType === AlertSourceType.NEWS) {
      if (!data.keywords?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one keyword is required for news alerts",
          path: ["keywords"],
        });
      }
    }
    if (data.sourceType === AlertSourceType.MARKET) {
      if (!data.ticker) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ticker is required for market alerts",
          path: ["ticker"],
        });
      }
      if (data.threshold == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Threshold is required for market alerts",
          path: ["threshold"],
        });
      }
    }
    for (let i = 0; i < data.channels.length; i++) {
      const ch = data.channels[i];
      const error = getChannel(ch.type).validate(ch.config);
      if (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error,
          path: ["channels", i, "config"],
        });
      }
    }
  });

export const updateAlertSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});
