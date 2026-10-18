import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/documents/regenerate
 * 
 * Safely triggers document generation for documents that have a valid snapshot
 * but no active storageKey (pending generation).
 * 
 * Phase 1 Safeguards:
 * 1. Never nullifies active storageKey (avoids download outages & race conditions).
 * 2. Never reconstructs historical financial facts from mutable live order data.
 * 3. Fails closed with SETTLEMENT_VERIFICATION_REQUIRED if snapshot is missing.
 * 4. Resolves document by documentId, orderNumber, or orderId (DEF-02).
 * 
 * Replacing an active storage pointer requires the candidate staging pipeline (Phase 2).
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { orderId, orderNumber, documentId } = body;

    if (!orderId && !orderNumber && !documentId) {
      return NextResponse.json(
        { error: "Missing identifier. Must provide orderId, orderNumber, or documentId" },
        { status: 400 }
      );
    }

    // 1. Resolve document
    let existingDoc: any = null;

    if (documentId) {
      existingDoc = await prisma.orderDocument.findUnique({
        where: { id: documentId },
        include: { order: true },
      });

      if (existingDoc && !["INVOICE", "FINAL_INVOICE"].includes(existingDoc.documentType)) {
        return NextResponse.json(
          { error: `Document type '${existingDoc.documentType}' is not supported for regeneration. Only INVOICE and FINAL_INVOICE are supported.` },
          { status: 400 }
        );
      }
    } else {
      const order = await prisma.order.findFirst({
        where: orderId ? { id: orderId } : { orderNumber: orderNumber! },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      existingDoc = await prisma.orderDocument.findFirst({
        where: {
          orderId: order.id,
          documentType: "INVOICE",
        },
        orderBy: { createdAt: "desc" },
        include: { order: true },
      });
    }

    if (!existingDoc) {
      return NextResponse.json({ error: "No INVOICE document found" }, { status: 404 });
    }

    // 2. Safeguard: Never reconstruct historical financial facts from mutable live order data
    if (!existingDoc.snapshot || typeof existingDoc.snapshot !== "object" || Object.keys(existingDoc.snapshot).length === 0) {
      logger.warn(
        { orderDocumentId: existingDoc.id, orderId: existingDoc.orderId },
        "Regeneration rejected: historical snapshot missing. Live reconstruction forbidden."
      );
      return NextResponse.json(
        {
          error: "SETTLEMENT_VERIFICATION_REQUIRED",
          message: "Historical invoice financial facts cannot be reconstructed from mutable live order data. Audited dual-approval workflow (Phase 2) required.",
        },
        { status: 422 }
      );
    }

    // 3. Safeguard: Never nullify active storage pointer before replacement is safely activated
    if (existingDoc.storageKey) {
      logger.warn(
        { orderDocumentId: existingDoc.id, storageKey: existingDoc.storageKey },
        "Regeneration rejected: direct overwrite of active storageKey forbidden."
      );
      return NextResponse.json(
        {
          error: "ACTIVE_STORAGE_POINTER_REPLACEMENT_REQUIRES_STAGING_JOB",
          message: "Directly nullifying active storageKey is forbidden. Document already has an active storageKey. Candidate staging pipeline (Phase 2) is required to replace active documents safely.",
          storageKey: existingDoc.storageKey,
        },
        { status: 409 }
      );
    }

    // 4. Safe path: Document has valid snapshot and storageKey is null (pending rendering)
    await inngest.send({
      name: "document/generation.requested",
      data: {
        orderDocumentId: existingDoc.id,
        documentType: existingDoc.documentType,
      },
    });

    logger.info(
      { orderId: existingDoc.orderId, orderDocumentId: existingDoc.id, adminId: session.user.id },
      "Triggered PDF generation from existing immutable snapshot"
    );

    return NextResponse.json({
      success: true,
      orderDocumentId: existingDoc.id,
      orderNumber: existingDoc.order?.orderNumber,
      message: "PDF generation triggered from existing immutable snapshot without mutating document state.",
    });
  } catch (error: any) {
    logger.error({ err: error }, "Failed in document regeneration route");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
