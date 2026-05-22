"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

// 1. Define Strict Zod Validation Schemas
const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().min(1, "Quantity must be at least 1").max(10, "Bulk purchase limit exceeded"),
    })
  ).min(1, "Cart cannot be empty"),
  shippingAddress: z.object({
    fullName: z.string().min(2, "Full name required").max(100),
    phone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid Bangladesh mobile number (e.g. 017xxxxxxxx)"),
    division: z.enum(["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"]),
    district: z.string().min(2, "District required").max(50),
    addressLine: z.string().min(5, "Detail address line required").max(300),
  }),
});

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

export async function initiateCheckout(rawPayload: unknown) {
  // 2. Validate incoming payload against strict schemas
  const validation = checkoutSchema.safeParse(rawPayload);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(", ")}`);
  }

  const payload = validation.data;

  // 3. Fetch real prices from database to block price spoofing
  const productIds = payload.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new Error("Invalid products in cart.");
  }

  // Check product stock availability
  for (const item of payload.items) {
    const matched = products.find(p => p.id === item.productId)!;
    if (!matched.inStock) {
      throw new Error(`Product ${matched.name} is currently out of stock.`);
    }
  }

  // 4. Calculate total prices in Paisa
  let totalPaisa = 0;
  const orderItemsData = payload.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const itemTotal = product.price * item.quantity;
    totalPaisa += itemTotal;

    return {
      productId: product.id,
      productName: product.name, // Record snapshots to survive product deletions
      quantity: item.quantity,
      unitPrice: product.price,
      total: itemTotal,
    };
  });

  const shippingCostPaisa = 15000; // Flat fee 150 BDT (in Paisa)
  const grandTotalPaisa = totalPaisa + shippingCostPaisa;

  // 5. Bypass Advance Booking (bKash disabled), 100% Cash on Delivery
  const balancePaisa = grandTotalPaisa;

  // Generate unique order number (e.g. RG-20260522-XXXXX)
  const timestamp = new Date().toISOString().slice(0,10).replace(/-/g,"");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `RG-${timestamp}-${randomSuffix}`;

  // 6. DB Transaction: Atomic order & payment creation
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: "guest",
      subtotal: totalPaisa,
      shippingCost: shippingCostPaisa,
      total: grandTotalPaisa,
      advancePaid: 0,
      balanceDue: grandTotalPaisa,
      status: "PROCESSING", // Bypass PENDING_ADVANCE hold
      shippingAddress: payload.shippingAddress,
      logistics: "PRIVATE_FREIGHT",
      trackingState: "PENDING_PRODUCTION",
      items: {
        create: orderItemsData,
      },
      paymentRecords: {
        create: [
          {
            amount: balancePaisa,
            method: "COD",
            type: "SETTLEMENT",
            status: "INITIATED",
          }
        ]
      }
    }
  });

  // 7. Bypass bKash API completely and redirect to success page
  return {
    bkashURL: `/checkout/success?order=${order.orderNumber}`,
  };
}
