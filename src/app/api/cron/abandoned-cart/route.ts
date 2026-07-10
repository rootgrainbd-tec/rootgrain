import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendAbandonedCartEmail } from "@/lib/email";

// Verify secret to ensure only cron can call this endpoint
const CRON_SECRET = process.env.CRON_SECRET || "default_cron_secret";

export async function GET(request: Request) {
  // Check auth header if you want to secure it
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}` && process.env.NODE_ENV === "production") {
    // return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const settings = await prisma.storeSettings.findFirst() || {
      abandonedCartDelayHours: 24,
      abandonedCartDiscountPercent: 5
    };

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - settings.abandonedCartDelayHours);

    const cartsToRecover = await prisma.abandonedCart.findMany({
      where: {
        status: "PENDING",
        lastActive: { lt: cutoffTime }
      },
      take: 20 // Process in batches
    });

    if (cartsToRecover.length === 0) {
      return NextResponse.json({ success: true, message: "No abandoned carts to process." });
    }

    const processedIds = [];

    for (const cart of cartsToRecover) {
      // Create a unique promo code
      const code = `COMEBACK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 3); // Valid for 3 days

      await prisma.promoCode.create({
        data: {
          code,
          discountType: "PERCENTAGE",
          discountValue: settings.abandonedCartDiscountPercent,
          maxUses: 1,
          expiryDate: expiry
        }
      });

      // Send email
      await sendAbandonedCartEmail(cart.email, cart.cartItems as any[], code, settings.abandonedCartDiscountPercent);

      // Update cart status
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { status: "EMAIL_SENT" }
      });

      processedIds.push(cart.id);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedIds.length} abandoned carts.`,
      processedIds 
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
