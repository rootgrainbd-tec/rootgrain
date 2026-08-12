import { NextResponse } from "next/server";
import { ProductRepository } from "@/repositories/product.repository";
import { ShippingRepository } from "@/repositories/shipping.repository";
import { ShippingEngine, CartItemShipping } from "@/services/shipping-engine.service";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors/AppError";

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ shippingCost: 0 });
    }

    // 1. Fetch DB products for accurate shippingType
    const productIds = items.map((i: any) => i.id);
    const dbProducts = await ProductRepository.findProductsBySlugs(productIds);

    const cartItemShippingList: CartItemShipping[] = items.map((item: any) => {
      const dbProd = dbProducts.find((p) => p.slug === item.id);
      return {
        productId: item.id,
        productName: dbProd?.name || item.id,
        shippingType: dbProd?.shippingType || null,
        quantity: item.quantity
      };
    });

    // 2. Fetch configured rates
    const shippingRates = await ShippingRepository.getAllShippingTypeRates();

    // 3. Calculate shipping cost securely on the server
    const shippingCost = ShippingEngine.calculate(cartItemShippingList, shippingRates);

    return NextResponse.json({ shippingCost });

  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error({ err: error }, "Failed to calculate shipping preview");
    return NextResponse.json(
      { error: "Internal server error during shipping calculation" },
      { status: 500 }
    );
  }
}
