"use server";

import prisma from "@/lib/prisma";
import { createBkashPayment } from "@/lib/bkash";

export interface CheckoutPayload {
  items: { productId: string; quantity: number }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    addressLine: string;
  };
}

export async function initiateCheckout(payload: CheckoutPayload) {
  // 1. Fetch real prices from DB to prevent client spoofing
  const productIds = payload.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new Error("Invalid products in cart.");
  }

  // 2. Calculate Total (in Paisa)
  let totalPaisa = 0;
  const orderItemsData = payload.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const itemTotal = product.price * item.quantity;
    totalPaisa += itemTotal;

    return {
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
    };
  });

  // 3. Calculate 20% Advance Booking Fee
  const advancePaisa = Math.round(totalPaisa * 0.20);
  const balancePaisa = totalPaisa - advancePaisa;

  // Convert to Taka string format for bKash API (e.g. "20000.00")
  const advanceTakaStr = (advancePaisa / 100).toFixed(2);

  // 4. Create Order and PaymentRecord atomically
  const order = await prisma.order.create({
    data: {
      userId: "guest", // Assuming guest checkout for now
      total: totalPaisa,
      status: "PENDING_ADVANCE",
      shippingAddress: payload.shippingAddress,
      logistics: "PRIVATE_FREIGHT",
      trackingState: "PENDING_PRODUCTION",
      items: {
        create: orderItemsData,
      },
      payments: {
        create: [
          {
            amount: advancePaisa,
            method: "BKASH_PGW",
            phase: "ADVANCE",
            status: "INITIATED",
          },
          {
            amount: balancePaisa,
            method: "COD",
            phase: "SETTLEMENT",
            status: "INITIATED",
          }
        ]
      }
    },
    include: {
      payments: true,
    }
  });

  // Find the advance payment record ID to use as bKash invoice reference
  const advancePayment = order.payments.find(p => p.phase === "ADVANCE")!;

  // 5. Initialize bKash Payment URL
  const bkashRes = await createBkashPayment(advanceTakaStr, advancePayment.id);

  // 6. Return redirect URL to client
  return {
    bkashURL: bkashRes.bkashURL,
  };
}
