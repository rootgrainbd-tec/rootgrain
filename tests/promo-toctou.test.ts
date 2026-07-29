import { test, expect } from 'vitest';
import prisma from '../src/lib/prisma';
import { CheckoutService } from '../src/services/checkout.service';
import { CheckoutPayload } from '../src/validations/checkout.schema';

test('BUG 2: Promo Code TOCTOU Race Condition Proof', async (t) => {
  // 1. Setup Data
  const promoCode = `RACE-${Date.now()}`;
  await prisma.promoCode.create({
    data: {
      code: promoCode,
      discountType: "FLAT",
      discountValue: 100,
      isActive: true,
      maxUses: 1, // Only 1 use allowed
      currentUses: 0,
    }
  });

  const product = await prisma.product.create({
    data: {
      id: `prod-${Date.now()}`,
      name: "Test Product",
      slug: `test-prod-${Date.now()}`,
      category: "test",
      price: 500,
      wood: "Oak",
      dimensions: "10x10",
      image: "image.png",
      description: "Test description",
    }
  });

  const payload: CheckoutPayload = {
    items: [{ id: product.slug, quantity: 1 }],
    address: {
      name: "Test User",
      email: "test@example.com",
      phone: "01700000000",
      street: "Test St",
    },
    district: "Dhaka",
    division: "Dhaka",
    promoCode: promoCode,
  };

  // 2. Execute concurrent requests
  const results = await Promise.allSettled([
    CheckoutService.processCheckout(payload, null),
    CheckoutService.processCheckout(payload, null),
  ]);

  const successfulOrders = results.filter(r => r.status === 'fulfilled');
  const failedOrders = results.filter(r => r.status === 'rejected');
  if (failedOrders.length > 0) {
    console.error("Some checkouts failed:", failedOrders.map(f => (f as PromiseRejectedResult).reason));
  }

  // 3. Check final promo state
  const finalPromo = await prisma.promoCode.findUnique({
    where: { code: promoCode }
  });

  // If the bug exists, this assertion will fail because currentUses will be 2
  expect(finalPromo?.currentUses).toBe(1);

  // Assert only one order was successful  // Proof: If the bug exists, successful orders > 1 and currentUses > maxUses
  expect(successfulOrders.length).toBe(1);
});
