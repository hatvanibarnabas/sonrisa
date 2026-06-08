import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAlertSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: session.id },
    include: { channels: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, sourceType, keywords, ticker, threshold, channels } = parsed.data;

    const alert = await prisma.alert.create({
      data: {
        userId: session.id,
        name,
        sourceType,
        keywords: keywords ?? [],
        ticker: ticker ?? null,
        threshold: threshold ?? null,
        channels: {
          create: channels.map((ch) => ({
            type: ch.type,
            config: ch.config as Prisma.InputJsonValue,
          })),
        },
      },
      include: { channels: true },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (err) {
    console.error("[CreateAlert]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
