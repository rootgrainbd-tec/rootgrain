import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderDocumentId } = body;

    if (!orderDocumentId) {
      return NextResponse.json({ error: "Missing orderDocumentId" }, { status: 400 });
    }

    const document = await prisma.orderDocument.findUnique({ where: { id: orderDocumentId } });
    
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.documentType !== "INVOICE") {
      return NextResponse.json({ error: "Only INVOICE document type is supported for retry" }, { status: 400 });
    }

    if (document.storageKey !== null) {
      return NextResponse.json({ error: "Document is already generated" }, { status: 400 });
    }

    await inngest.send({ name: "document/generation.requested", data: { orderDocumentId, documentType: "INVOICE" } });
    
    logger.info({ orderDocumentId, adminId: session.user.id }, "Manually triggered document generation retry");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ err: error }, "Failed to process document retry");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
