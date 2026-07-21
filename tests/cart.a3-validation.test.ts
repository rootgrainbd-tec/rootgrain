import test from "node:test";
import assert from "node:assert";
import { z } from "zod";

// Copied schemas from route.ts for validation tests
const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
}).strip();

const cartSyncSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  cartItems: z.array(cartItemSchema).max(50),
}).strip();

test('SECURITY-H2-A3 Request Validation Invariants', async (t) => {
  await t.test('1. Unknown fields stripped from item', () => {
    const maliciousItem = {
      productId: "63f92d47-f350-4202-b203-b09b5523da56",
      quantity: 5,
      price: 1000,
      name: "Injected product",
      isAdmin: true
    };
    
    const res = cartItemSchema.safeParse(maliciousItem);
    assert.strictEqual(res.success, true);
    
    if (res.success) {
      assert.strictEqual(res.data.productId, "63f92d47-f350-4202-b203-b09b5523da56");
      assert.strictEqual(res.data.quantity, 5);
      assert.strictEqual((res.data as any).price, undefined);
      assert.strictEqual((res.data as any).isAdmin, undefined);
    }
  });

  await t.test('2. Invalid UUID rejected', () => {
    const invalidItem = {
      productId: "drop table users",
      quantity: 5
    };
    
    const res = cartItemSchema.safeParse(invalidItem);
    assert.strictEqual(res.success, false);
  });

  await t.test('3. Max quantity cap enforced by schema', () => {
    const maxItem = { productId: "63f92d47-f350-4202-b203-b09b5523da56", quantity: 100 };
    const res = cartItemSchema.safeParse(maxItem);
    assert.strictEqual(res.success, false);
  });

  await t.test('4. Min quantity cap enforced by schema', () => {
    const minItem = { productId: "63f92d47-f350-4202-b203-b09b5523da56", quantity: 0 };
    const res = cartItemSchema.safeParse(minItem);
    assert.strictEqual(res.success, false);
  });

  await t.test('5. Too many items rejected', () => {
    const items = Array(51).fill({ productId: "63f92d47-f350-4202-b203-b09b5523da56", quantity: 1 });
    const payload = { cartItems: items };
    const res = cartSyncSchema.safeParse(payload);
    assert.strictEqual(res.success, false);
  });
});
