import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const ALLOWED_ORDERS = ["RG-20260905-949006", "RG-20260905-847631"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber");

  if (!orderNumber || !ALLOWED_ORDERS.includes(orderNumber)) {
    return NextResponse.json({ error: "Invalid or unauthorized order number" }, { status: 403 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true
          }
        },
        events: true,
        documents: true,
        paymentRecords: true
      }
    });

    const isSuccessTarget = orderNumber === "RG-20260905-949006";

    let idempotency = null;
    let idempotencyDuplicateCount = 0;
    let outbox: any[] = [];
    let recentOrders: any[] = [];

    if (order) {
      idempotency = await prisma.idempotencyKey.findFirst({
        where: { resultReference: order.id }
      });

      if (idempotency) {
        idempotencyDuplicateCount = await prisma.idempotencyKey.count({
          where: {
            key: idempotency.key,
            NOT: {
              ownerType: idempotency.ownerType,
              ownerId: idempotency.ownerId,
              scope: idempotency.scope,
              key: idempotency.key
            }
          }
        });
      }

      outbox = await prisma.notificationOutbox.findMany({
        where: { orderId: order.id }
      });

      recentOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(order.createdAt.getTime() - 5 * 60000),
            lte: new Date(order.createdAt.getTime() + 5 * 60000)
          },
          isMtoOrder: true,
          id: { not: order.id }
        },
        select: {
          orderNumber: true,
          id: true,
          createdAt: true,
          isMtoOrder: true,
          total: true
        }
      });
    }

    const report = {
      target: orderNumber,
      existence: !!order,
      order: null as any,
      orderItems: null as any,
      events: null as any,
      document: null as any,
      outbox: null as any,
      payments: null as any,
      idempotency: null as any,
      duplicateProximity: null as any,
      finalVerdict: null as any
    };

    if (!order) {
      report.finalVerdict = isSuccessTarget ? "FAIL: ORDER MISSING" : "PASS: ROLLED BACK";
      return NextResponse.json(report);
    }

    report.order = {
      id: order.id,
      status: order.status,
      isMtoOrder: order.isMtoOrder,
      total: order.total,
      subtotal: order.subtotal,
      requiredAdvance: order.requiredAdvance,
      advancePaid: order.advancePaid,
      shippingCost: order.shippingCost,
      logistics: order.logistics,
      estimatedManufacturingDays: order.estimatedManufacturingDays
    };

    const orderValid = 
      order.id === "cmtolal9n0000js041yn4fdkx" &&
      order.status === "PENDING_ADVANCE" &&
      order.isMtoOrder === true &&
      order.total === 31000 &&
      order.requiredAdvance === 15500 &&
      order.advancePaid === 0 &&
      order.shippingCost === 0 &&
      order.estimatedManufacturingDays === 30;

    report.orderItems = {
      count: order.items.length,
      items: order.items.map(item => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        productExists: !!item.product,
        productActive: item.product?.isActive,
        productIsMto: item.product?.isMto
      }))
    };

    const itemsValid = order.items.length === 1 && 
      order.items[0].quantity === 1 && 
      order.items[0].unitPrice === 31000 && 
      order.items[0].total === 31000 &&
      !!order.items[0].product &&
      order.items[0].product?.isActive === true &&
      order.items[0].product?.isMto === true;

    const orderPlacedEvents = order.events.filter(e => e.eventType === "ORDER_PLACED");
    report.events = {
      count: order.events.length,
      orderPlacedCount: orderPlacedEvents.length,
      sequences: order.events.map(e => e.sequence)
    };

    const eventsValid = orderPlacedEvents.length === 1;

    const invoice = order.documents.find(d => d.documentType === 'INVOICE');
    report.document = invoice ? {
      documentType: invoice.documentType,
      status: invoice.status,
      storageKeyExists: !!invoice.storageKey
    } : null;

    const documentValid = invoice && invoice.storageKey;

    const confirmationOutbox = outbox.find(o => o.notificationType === 'ORDER_CONFIRMATION');
    report.outbox = confirmationOutbox ? {
      notificationType: confirmationOutbox.notificationType,
      status: confirmationOutbox.status,
      attempts: confirmationOutbox.attempts,
      processedAtExists: !!confirmationOutbox.processedAt,
      lastErrorExists: !!confirmationOutbox.lastError
    } : null;

    const outboxValid = !!confirmationOutbox;

    report.payments = {
      count: order.paymentRecords.length
    };
    const paymentsValid = order.paymentRecords.length === 0;

    report.idempotency = idempotency ? {
      ownerType: idempotency.ownerType,
      ownerId: "REDACTED_SAFE",
      scope: idempotency.scope,
      status: idempotency.status,
      resultReference: idempotency.resultReference,
      responsePayloadExists: !!idempotency.responsePayload,
      duplicateCount: idempotencyDuplicateCount
    } : null;

    const idempotencyValid = idempotency && 
      idempotency.status === 'COMPLETED' && 
      idempotency.resultReference === order.id &&
      !!idempotency.responsePayload &&
      idempotencyDuplicateCount === 0;

    report.duplicateProximity = recentOrders.map(ro => ({
      orderNumber: ro.orderNumber,
      id: ro.id,
      createdAt: ro.createdAt,
      total: ro.total,
      isMtoOrder: ro.isMtoOrder
    }));

    if (orderValid && itemsValid && eventsValid && documentValid && outboxValid && paymentsValid && idempotencyValid) {
      report.finalVerdict = "PASS: INTACT";
    } else {
      report.finalVerdict = "FAIL: INVARIANT MISMATCH";
      (report as any).debug = { orderValid, itemsValid, eventsValid, documentValid, outboxValid, paymentsValid, idempotencyValid };
    }

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
