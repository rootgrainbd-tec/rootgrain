import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { NotificationOutboxStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { outboxId, type } = body;

    if (type === "stale_recovery") {
      // Find all PROCESSING outboxes older than 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const staleItems = await prisma.notificationOutbox.findMany({
        where: {
          status: NotificationOutboxStatus.PROCESSING,
          updatedAt: { lt: fifteenMinutesAgo }
        },
        select: { id: true }
      });

      if (staleItems.length === 0) {
        return NextResponse.json({ success: true, count: 0, message: "No stale items found" });
      }

      await prisma.notificationOutbox.updateMany({
        where: {
          id: { in: staleItems.map(item => item.id) }
        },
        data: {
          status: NotificationOutboxStatus.PENDING,
          updatedAt: new Date()
        }
      });

      const events = staleItems.map(item => ({
        name: "communication/email.requested" as const,
        data: { outboxId: item.id }
      }));

      await inngest.send(events);
      
      logger.info({ count: staleItems.length, adminId: session.user.id }, "Recovered stale communication outbox items");
      return NextResponse.json({ success: true, count: staleItems.length });
    }

    if (!outboxId) {
      return NextResponse.json({ error: "Missing outboxId" }, { status: 400 });
    }

    const outbox = await prisma.notificationOutbox.findUnique({ where: { id: outboxId } });
    if (!outbox) {
      return NextResponse.json({ error: "Outbox not found" }, { status: 404 });
    }

    if (outbox.status === NotificationOutboxStatus.SENT) {
      return NextResponse.json({ error: "Already sent" }, { status: 400 });
    }

    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: {
        status: NotificationOutboxStatus.PENDING,
        updatedAt: new Date()
      }
    });

    await inngest.send({ name: "communication/email.requested", data: { outboxId } });
    
    logger.info({ outboxId, adminId: session.user.id }, "Manually triggered communication retry");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ err: error }, "Failed to process communication retry");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
