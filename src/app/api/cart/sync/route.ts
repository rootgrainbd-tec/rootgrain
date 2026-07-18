import { NextResponse } from "next/server";
import { CartService } from "@/services/cart.service";
import { logger } from "@/lib/logger";
import { z } from "zod";

const cartSyncSchema = z.object({
  email: z.string().email(),
  cartItems: z.array(z.any()).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validationResult = cartSyncSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 });
    }

    const { email, cartItems } = validationResult.data;

    await CartService.syncCart(email, cartItems);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Cart sync route error");
    return NextResponse.json({ success: false, message: "Failed to sync cart" }, { status: 500 });
  }
}
