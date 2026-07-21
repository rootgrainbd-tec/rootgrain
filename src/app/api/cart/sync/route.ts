import { NextResponse } from "next/server";
import { CartService } from "@/services/cart.service";
import { logger } from "@/lib/logger";
import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
}).strip(); // Strips unknown fields like price, title, etc.

const cartSyncSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  cartItems: z.array(cartItemSchema).max(50),
}).strip();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validationResult = cartSyncSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ success: false, message: "Invalid cart payload" }, { status: 400 });
    }

    const { email, cartItems } = validationResult.data;

    // Service handles identity resolution, normalization, transitions, and persistence
    await CartService.processSyncRequest(cartItems, email || "");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Cart sync route error");
    return NextResponse.json({ success: false, message: "Failed to sync cart" }, { status: 500 });
  }
}
