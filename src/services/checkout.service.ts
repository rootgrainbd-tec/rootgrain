import "server-only";
import { randomInt } from "crypto";
import { CheckoutPayload } from "@/validations/checkout.schema";
import { ProductRepository } from "@/repositories/product.repository";
import { ShippingRepository } from "@/repositories/shipping.repository";
import { PromoRepository } from "@/repositories/promo.repository";
import { OrderRepository } from "@/repositories/order.repository";
import { CartRepository } from "@/repositories/cart.repository";
import { ValidationError, NotFoundError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logger";

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = randomInt(100000, 1000000);
  return `RG-${date}-${random}`;
}

export class CheckoutService {
  static async validateCoupon(code: string, subtotal: number) {
    if (!code) {
      throw new ValidationError("No code provided");
    }

    const promo = await PromoRepository.getPromoByCode(code);

    if (!promo) {
      throw new NotFoundError("Invalid promo code");
    }

    if (!promo.isActive) {
      throw new ValidationError("This promo code is no longer active");
    }

    if (promo.expiryDate && new Date() > promo.expiryDate) {
      throw new ValidationError("This promo code has expired");
    }

    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      throw new ValidationError("This promo code has reached its usage limit");
    }

    let discountAmount = 0;
    if (promo.discountType === "PERCENTAGE") {
      discountAmount = Math.floor(subtotal * (promo.discountValue / 100));
    } else {
      discountAmount = promo.discountValue; // Flat amount in Taka
    }

    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      code: promo.code,
      discountAmount,
      type: promo.discountType,
      value: promo.discountValue
    };
  }

  static async processCheckout(payload: CheckoutPayload, userId: string | null) {
    logger.info({ userId, itemsCount: payload.items.length }, "Processing checkout");

    const { items, address, district, division, promoCode } = payload;
    const productIds = items.map((i) => i.id);

    // 1. Fetch products
    const dbProducts = await ProductRepository.findProductsBySlugs(productIds);

    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const dbProd = dbProducts.find((p) => p.slug === item.id);
      if (!dbProd) {
        throw new NotFoundError(`Product not found: ${item.id}`);
      }
      if (!dbProd.isActive || !dbProd.inStock) {
        throw new ValidationError(`Product ${dbProd.name} is currently unavailable.`);
      }

      const itemTotal = dbProd.price * item.quantity;
      subtotal += itemTotal;

      return {
        productId: dbProd.id,
        productName: dbProd.name,
        quantity: item.quantity,
        unitPrice: dbProd.price,
        total: itemTotal,
      };
    });

    // 2. Calculate shipping
    const shippingRate = await ShippingRepository.getShippingRateByDistrict(district);
    if (!shippingRate) {
      throw new ValidationError("Shipping is not available for this district.");
    }

    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    let shippingCost = shippingRate.baseRate;
    if (totalQuantity > 1) {
      shippingCost += (totalQuantity - 1) * shippingRate.perItemRate;
    }

    // 3. Apply Promo Code
    let discountAmount = 0;
    if (promoCode) {
      const promo = await PromoRepository.getPromoByCode(promoCode);
      if (
        promo &&
        promo.isActive &&
        (!promo.expiryDate || new Date() <= promo.expiryDate) &&
        (promo.maxUses === null || promo.currentUses < promo.maxUses)
      ) {
        if (promo.discountType === "PERCENTAGE") {
          discountAmount = Math.floor(subtotal * (promo.discountValue / 100));
        } else {
          discountAmount = promo.discountValue;
        }

        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }

        await PromoRepository.incrementPromoUsage(promo.id);
      } else {
        logger.warn({ promoCode }, "Invalid or expired promo code used during checkout");
      }
    }

    const total = subtotal + shippingCost - discountAmount;
    const balanceDue = total;

    // 4. Create Order
    const order = await OrderRepository.createOrder({
      orderNumber: generateOrderNumber(),
      user: userId ? { connect: { id: userId } } : undefined,
      subtotal,
      shippingCost,
      total,
      balanceDue,
      promoCode,
      discountAmount,
      status: "PENDING_ADVANCE",
      logistics: "PRIVATE_FREIGHT",
      shippingAddress: {
        name: address.name,
        email: address.email,
        phone: address.phone,
        division,
        district,
        street: address.street,
        postCode: address.postCode,
      },
      items: {
        create: orderItemsData,
      },
    });

    logger.info({ orderId: order.id, orderNumber: order.orderNumber }, "Order created successfully");

    // 5. Fire background jobs (To be replaced with Inngest)
    // sendOrderConfirmationEmail(order, address.email).catch(console.error);

    // 6. Recover abandoned cart
    try {
      await CartRepository.markCartsAsRecovered(address.email);
    } catch (e) {
      logger.error({ err: e, email: address.email }, "Failed to update abandoned cart");
    }

    return order;
  }
}
