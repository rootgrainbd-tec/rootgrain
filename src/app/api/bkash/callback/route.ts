import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { executeBkashPayment } from "@/lib/bkash";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentID = searchParams.get("paymentID");
  const status = searchParams.get("status");

  if (!paymentID) {
    return NextResponse.json({ error: "Missing paymentID" }, { status: 400 });
  }

  // Find the associated PaymentRecord (we used paymentRecord.id as merchantInvoiceNumber)
  // But wait, the execute API actually returns the merchantInvoiceNumber.
  // It's safer to just execute the payment first and get the details from bKash.

  if (status === "success") {
    try {
      // 1. Execute Payment with bKash
      const executeRes = await executeBkashPayment(paymentID);

      if (executeRes.statusCode && executeRes.statusCode !== "0000") {
        // e.g., 2023 Insufficient Balance, or 2062 The payment has already been completed
        if (executeRes.statusCode === "2062") {
          // Double execution attempt. Just redirect to success page.
          return NextResponse.redirect(new URL("/checkout/success", request.url));
        }
        return NextResponse.redirect(new URL("/checkout/error?reason=execution_failed", request.url));
      }

      // executeRes contains merchantInvoiceNumber which maps to PaymentRecord.id
      const paymentRecordId = executeRes.merchantInvoiceNumber;
      const trxID = executeRes.trxID;

      // 2. Prisma Transaction to guarantee atomicity and prevent race conditions
      await prisma.$transaction(async (tx) => {
        // Lock or check current status
        const record = await tx.paymentRecord.findUnique({
          where: { id: paymentRecordId },
          include: { order: true },
        });

        if (!record) throw new Error("Payment record not found");
        if (record.status === "COMPLETED") return; // Already processed

        // Update Payment Record
        await tx.paymentRecord.update({
          where: { id: paymentRecordId },
          data: {
            status: "COMPLETED",
            trxId: trxID,
          },
        });

        // Update Order Status to PROCESSING
        await tx.order.update({
          where: { id: record.orderId },
          data: {
            status: "PROCESSING",
          },
        });
      });

      return NextResponse.redirect(new URL("/checkout/success", request.url));

    } catch (error) {
      console.error("bKash Execution Error:", error);
      return NextResponse.redirect(new URL("/checkout/error?reason=internal_error", request.url));
    }
  }

  // Handle cancelled or failed statuses
  return NextResponse.redirect(new URL(`/checkout/error?reason=${status}`, request.url));
}
