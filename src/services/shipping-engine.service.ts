import { ShippingTypeRate } from "@prisma/client";
import { ValidationError } from "@/lib/errors/AppError";

export interface CartItemShipping {
  productId: string;
  productName: string;
  shippingType: string | null;
  quantity: number;
}

export class ShippingEngine {
  private static SMALL_TYPES = ["small_1", "small_2"];
  private static LARGE_TYPES = ["medium", "large", "bulky"];

  static calculate(items: CartItemShipping[], rates: ShippingTypeRate[]): number {
    if (!items || items.length === 0) return 0;

    // Build a map of active rates
    const rateMap = new Map<string, ShippingTypeRate>();
    rates.forEach(r => rateMap.set(r.shippingType, r));

    // Aggregate quantities by shipping type
    const typeQuantities = new Map<string, number>();

    for (const item of items) {
      if (!item.shippingType) {
        throw new ValidationError(
          `Shipping calculation failed: Product "${item.productName}" is missing a shipping type. Please contact support.`
        );
      }
      
      const currentQty = typeQuantities.get(item.shippingType) || 0;
      typeQuantities.set(item.shippingType, currentQty + item.quantity);
    }

    // Check if any Large type exists
    let hasLargeType = false;
    for (const type of Array.from(typeQuantities.keys())) {
      if (this.LARGE_TYPES.includes(type)) {
        hasLargeType = true;
        break;
      }
    }

    let totalShippingCost = 0;

    // Calculate cost per type
    for (const [type, quantity] of Array.from(typeQuantities.entries())) {
      // If it's a small type and a large type exists, shipping is FREE
      if (this.SMALL_TYPES.includes(type) && hasLargeType) {
        continue;
      }

      const rate = rateMap.get(type);
      if (!rate) {
        throw new ValidationError(
          `Shipping calculation failed: No active shipping rate found for type "${type}". Please contact support.`
        );
      }

      // Calculate cost: Base + Additional * (Qty - 1)
      const typeCost = rate.baseRate + rate.additionalRate * (quantity - 1);
      totalShippingCost += typeCost;
    }

    return totalShippingCost;
  }
}
