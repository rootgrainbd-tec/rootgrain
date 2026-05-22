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

  const successUrl = new URL("/checkout/success", request.url);
  const errorUrl = new URL("/checkout/error", request.url);

  if (status === "success") {
    try {
      // 1. Execute payment with bKash Gateway
      const executeRes = await executeBkashPayment(paymentID);

      if (executeRes.statusCode && executeRes.statusCode !== "0000") {
        if (executeRes.statusCode === "2062") {
          // Double click protection: bKash returned "Already Processed"
          return NextResponse.redirect(successUrl);
        }
        errorUrl.searchParams.set("reason", `gateway_${executeRes.statusCode}`);
        return NextResponse.redirect(errorUrl);
      }

      // merchantInvoiceNumber maps to PaymentRecord.id
      const paymentRecordId = executeRes.merchantInvoiceNumber;
      const trxID = executeRes.trxID;

      if (!paymentRecordId) {
        throw new Error("Payment executing response did not contain merchantInvoiceNumber");
      }

      // 2. Atomic Database Transaction Block
      // Corrects update parameter to "bkashTrxId"
      await prisma.$transaction(async (tx) => {
        const record = await tx.paymentRecord.findUnique({
          where: { id: paymentRecordId },
          include: { order: true },
        });

        if (!record) {
          throw new Error(`Payment record ${paymentRecordId} not found`);
        }

        // Avoid double processing
        if (record.status === "COMPLETED") {
          return;
        }

        // Update Payment Record with Transaction ID
        await tx.paymentRecord.update({
          where: { id: paymentRecordId },
          data: {
            status: "COMPLETED",
            bkashTrxId: trxID,
            paidAt: new Date(),
          },
        });

        // Update main Order State and financial totals
        await tx.order.update({
          where: { id: record.orderId },
          data: {
            status: "PROCESSING",
            advancePaid: record.amount,
            balanceDue: {
              decrement: record.amount,
            },
          },
        });
      });

      return NextResponse.redirect(successUrl);

    } catch (error) {
      console.error("CRITICAL: bKash Execution Callback Failed:", error);
      errorUrl.searchParams.set("reason", "internal_execution_failure");
      return NextResponse.redirect(errorUrl);
    }
  }

  // Handle cancelled or failed checkout states gracefully
  errorUrl.searchParams.set("reason", status || "cancelled");
  return NextResponse.redirect(errorUrl);
}
