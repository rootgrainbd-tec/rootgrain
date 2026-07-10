import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, cartItems } = await req.json();

    if (!email || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ success: false, message: "Missing data" }, { status: 400 });
    }

    // Check if there is already a PENDING cart for this email
    const existing = await prisma.abandonedCart.findFirst({
      where: {
        email: email,
        status: "PENDING"
      }
    });

    if (existing) {
      // Update existing cart
      await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          cartItems,
          lastActive: new Date()
        }
      });
    } else {
      // Create new abandoned cart entry
      await prisma.abandonedCart.create({
        data: {
          email,
          cartItems,
          status: "PENDING",
          lastActive: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart sync error:", error);
    return NextResponse.json({ success: false, message: "Failed to sync cart" }, { status: 500 });
  }
}
