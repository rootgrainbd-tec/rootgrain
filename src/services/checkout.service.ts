import "server-only";
import { randomInt } from "crypto";
import prisma from "@/lib/prisma";
import { CheckoutPayload } from "@/validations/checkout.schema";
import { ProductRepository } from "@/repositories/product.repository";
import { ShippingRepository } from "@/repositories/shipping.repository";
import { PromoRepository } from "@/repositories/promo.repository";
import { OrderRepository } from "@/repositories/order.repository";
import { CartRepository } from "@/repositories/cart.repository";
import { ShippingEngine, CartItemShipping } from "@/services/shipping-engine.service";
import { ValidationError, NotFoundError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logger";
import { generateGuestTrackingToken, hashGuestTrackingToken } from "@/lib/capability-token";
import { sendOrderConfirmationEmail } from "@/lib/email";

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

    // 2. Calculate shipping using the new ShippingEngine
    const shippingRates = await ShippingRepository.getAllShippingTypeRates();
    
    const cartItemShippingList: CartItemShipping[] = items.map(item => {
      const dbProd = dbProducts.find((p) => p.slug === item.id);
      return {
        productId: item.id,
        productName: dbProd?.name || item.id,
        shippingType: dbProd?.shippingType || null,
        quantity: item.quantity
      };
    });

    const shippingCost = ShippingEngine.calculate(cartItemShippingList, shippingRates);

    // 3. Apply Promo Code
    let discountAmount = 0;
    let appliedPromo: any = null;
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

        appliedPromo = promo;
      } else {
        logger.warn({ promoCode }, "Invalid or expired promo code used during checkout");
      }
    }

    const total = subtotal + shippingCost - discountAmount;
    const balanceDue = total;

    // 4. Generate guest tracking capability token if applicable
    let guestTokenHash: string | undefined;
    let rawGuestToken: string | undefined;
    
    // Only generate for GUEST orders (no userId)
    if (!userId) {
      rawGuestToken = generateGuestTrackingToken();
      guestTokenHash = hashGuestTrackingToken(rawGuestToken);
    }

    // 5. Create Order
    const order = await prisma.$transaction(async (tx) => {
      if (appliedPromo) {
        const updateResult = await tx.promoCode.updateMany({
          where: {
            id: appliedPromo.id,
            ...(appliedPromo.maxUses !== null ? { currentUses: { lt: appliedPromo.maxUses } } : {})
          },
          data: { currentUses: { increment: 1 } }
        });

        if (updateResult.count === 0) {
          throw new ValidationError("Promo code is no longer valid or has reached its usage limit.");
        }
      }

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          user: userId ? { connect: { id: userId } } : undefined,
          subtotal,
          shippingCost,
          total,
          balanceDue,
          promoCode: appliedPromo ? promoCode : undefined,
          discountAmount,
          guestTokenHash,
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
        },
        include: { items: true },
      });
    });

    logger.info({ orderId: order.id, orderNumber: order.orderNumber }, "Order created successfully");

    // 5. Fire background jobs
    sendOrderConfirmationEmail(order, address.email, rawGuestToken).catch(console.error);

    // 6. Recover abandoned cart
    try {
      await CartRepository.markCartsAsRecovered(address.email);
    } catch (e) {
      logger.error({ err: e, email: address.email }, "Failed to update abandoned cart");
    }

    return { order, rawGuestToken };
  }
}
