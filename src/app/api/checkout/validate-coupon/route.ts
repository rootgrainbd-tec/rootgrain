import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promo) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
    }

    if (!promo.isActive) {
      return NextResponse.json({ error: "This promo code is no longer active" }, { status: 400 });
    }

    if (promo.expiryDate && new Date() > promo.expiryDate) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
    }

    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      return NextResponse.json({ error: "This promo code has reached its usage limit" }, { status: 400 });
    }

    let discountAmount = 0;
    if (promo.discountType === "PERCENTAGE") {
      discountAmount = Math.floor(subtotal * (promo.discountValue / 100));
    } else {
      discountAmount = promo.discountValue; // Flat amount in Taka
    }

    // Ensure discount isn't more than subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return NextResponse.json({
      success: true,
      code: promo.code,
      discountAmount,
      type: promo.discountType,
      value: promo.discountValue
    });
  } catch (error) {
    console.error("Coupon Validation Error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
