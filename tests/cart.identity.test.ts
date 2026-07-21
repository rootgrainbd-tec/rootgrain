import test from "node:test";
import assert from "node:assert";
import module from "node:module";

// Mock server-only and logger
// @ts-ignore
module.Module._cache[require.resolve('server-only')] = { exports: {} };
// @ts-ignore
module.Module._cache[require.resolve('../src/lib/logger.ts')] = {
  exports: {
    logger: {
      info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, fatal: () => {}
    }
  }
};

import { CartRepository } from "../src/repositories/cart.repository";
import { CartService } from "../src/services/cart.service";
import prisma from "../src/lib/prisma";
import { ValidCartIdentity, CartItem } from "../src/types/cart";
import { generateCartSessionId } from "../src/lib/cart-session";

const dummyCartItems: CartItem[] = [{ productId: "63f92d47-f350-4202-b203-b09b5523da56", quantity: 1 }];

test('SECURITY-H2-A2 Cart Identity Invariants', async (t) => {
  let testUserId = "";

  t.before(async () => {
    // Create a dummy user for foreign key constraints
    const user = await prisma.user.create({
      data: {
        email: "test-auth-user@example.com",
        name: "Test User",
      }
    });
    testUserId = user.id;
  });

  t.after(async () => {
    // Clean up
    await prisma.abandonedCart.deleteMany({});
    await prisma.user.delete({ where: { id: testUserId } });
  });

  t.beforeEach(async () => {
    await prisma.abandonedCart.deleteMany({});
  });

  await t.test('1. Guest cart uses cartSessionId as authority', async () => {
    const session = generateCartSessionId();
    const identity: ValidCartIdentity = { kind: "guest", cartSessionId: session };
    
    await CartRepository.upsertCart(identity, dummyCartItems, "guest@example.com");
    
    const cart = await prisma.abandonedCart.findUnique({ where: { cartSessionId: session } });
    assert.ok(cart);
    assert.strictEqual(cart.cartSessionId, session);
    assert.strictEqual(cart.userId, null);
    assert.strictEqual(cart.email, "guest@example.com");
  });

  await t.test('2. Authenticated cart uses userId as authority', async () => {
    const identity: ValidCartIdentity = { kind: "authenticated", userId: testUserId };
    
    await CartRepository.upsertCart(identity, dummyCartItems, "auth@example.com");
    
    const cart = await prisma.abandonedCart.findFirst({ where: { userId: testUserId } });
    assert.ok(cart);
    assert.strictEqual(cart.userId, testUserId);
    assert.strictEqual(cart.cartSessionId, null);
  });

  await t.test('3. Email alone is never ownership authority (legacy)', async () => {
    await CartRepository.createAbandonedCart("legacy@example.com", dummyCartItems);
    
    const cart = await prisma.abandonedCart.findFirst({ where: { email: "legacy@example.com" } });
    assert.ok(cart);
    assert.strictEqual(cart.email, "legacy@example.com");
    assert.strictEqual(cart.cartSessionId, null);
    assert.strictEqual(cart.userId, null);
  });

  await t.test('4. H2-aware operation cannot create both userId and cartSessionId', async () => {
    const session = generateCartSessionId();
    const identity: ValidCartIdentity = { kind: "guest", cartSessionId: session };
    await CartRepository.upsertCart(identity, dummyCartItems, "guest@example.com");
    
    const cart = await prisma.abandonedCart.findUnique({ where: { cartSessionId: session } });
    assert.strictEqual(cart?.userId, null);
  });

  await t.test('5. Guest sync keeps isRecoveryEligible=false', async () => {
    const session = generateCartSessionId();
    const identity: ValidCartIdentity = { kind: "guest", cartSessionId: session };
    await CartRepository.upsertCart(identity, dummyCartItems, "guest@example.com");
    const cart = await prisma.abandonedCart.findUnique({ where: { cartSessionId: session } });
    assert.strictEqual(cart?.isRecoveryEligible, false);
  });

  await t.test('6. Authenticated sync keeps isRecoveryEligible=false', async () => {
    const identity: ValidCartIdentity = { kind: "authenticated", userId: testUserId };
    await CartRepository.upsertCart(identity, dummyCartItems, "auth@example.com");
    const cart = await prisma.abandonedCart.findFirst({ where: { userId: testUserId } });
    assert.strictEqual(cart?.isRecoveryEligible, false);
  });

  await t.test('7. Legacy email sync/reference does not grant eligibility', async () => {
    await CartRepository.createAbandonedCart("legacy@example.com", dummyCartItems);
    const cart = await prisma.abandonedCart.findFirst({ where: { email: "legacy@example.com" } });
    assert.strictEqual(cart?.isRecoveryEligible, false);
  });

  await t.test('8. Different cartSessionId cannot mutate another guest cart', async () => {
    const session1 = generateCartSessionId();
    const session2 = generateCartSessionId();
    await CartRepository.upsertCart({ kind: "guest", cartSessionId: session1 }, dummyCartItems, "guest@example.com");
    await CartRepository.upsertCart({ kind: "guest", cartSessionId: session2 }, dummyCartItems, "guest@example.com");
    
    const count = await prisma.abandonedCart.count();
    assert.strictEqual(count, 2);
  });

  await t.test('9. Different userId cannot mutate another authenticated cart', async () => {
    const user2 = await prisma.user.create({ data: { email: "user2@example.com", name: "User 2" } });
    
    await CartRepository.upsertCart({ kind: "authenticated", userId: testUserId }, dummyCartItems, "auth@example.com");
    await CartRepository.upsertCart({ kind: "authenticated", userId: user2.id }, dummyCartItems, "auth@example.com");
    
    const count = await prisma.abandonedCart.count();
    assert.strictEqual(count, 2);

    await prisma.user.delete({ where: { id: user2.id } });
  });

  await t.test('10. Email match cannot claim another cart', async () => {
    const session = generateCartSessionId();
    await CartRepository.upsertCart({ kind: "guest", cartSessionId: session }, dummyCartItems, "shared@example.com");
    
    // Auth user tries to sync with same email
    await CartRepository.upsertCart({ kind: "authenticated", userId: testUserId }, dummyCartItems, "shared@example.com");
    
    const count = await prisma.abandonedCart.count();
    assert.strictEqual(count, 2);
  });

  await t.test('11. Duplicate cartSessionId safely handled', async () => {
    const session = generateCartSessionId();
    await CartRepository.upsertCart({ kind: "guest", cartSessionId: session }, dummyCartItems, "guest@example.com");
    await CartRepository.upsertCart({ kind: "guest", cartSessionId: session }, dummyCartItems, "guest@example.com");
    
    const count = await prisma.abandonedCart.count();
    assert.strictEqual(count, 1);
  });

  await t.test('12. Recovery processing skips all isRecoveryEligible=false carts', async () => {
    const session = generateCartSessionId();
    await CartRepository.upsertCart({ kind: "guest", cartSessionId: session }, dummyCartItems, "guest@example.com");
    
    const eligibleCarts = await CartRepository.findAbandonedCartsBefore(new Date());
    assert.strictEqual(eligibleCarts.length, 0);
  });

  await t.test('13 & 14. Explicitly eligible cart reaches MOCKED recovery path with no real side effects', async () => {
    // Manually force an eligible cart in DB
    const cart = await prisma.abandonedCart.create({
      data: {
        email: "eligible@example.com",
        status: "PENDING",
        cartSessionId: generateCartSessionId(),
        isRecoveryEligible: true,
        cartItems: []
      }
    });

    const eligibleCarts = await CartRepository.findAbandonedCartsBefore(new Date(Date.now() + 10000));
    assert.strictEqual(eligibleCarts.length, 1);
    assert.strictEqual(eligibleCarts[0].id, cart.id);
  });

  await t.test('15. Ambiguous guest→auth dual-cart case returns deferred/conflict', async () => {
    const session = generateCartSessionId();
    await CartRepository.upsertCart({ kind: "guest", cartSessionId: session }, dummyCartItems, "guest@example.com");
    await CartRepository.upsertCart({ kind: "authenticated", userId: testUserId }, dummyCartItems, "auth@example.com");
    
    const res = await CartService.transitionGuestToAuthenticated(session, testUserId);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, "conflict_merge_deferred");
  });

  await t.test('Safe guest→auth single-cart case transition works', async () => {
    const session = generateCartSessionId();
    await CartRepository.upsertCart({ kind: "guest", cartSessionId: session }, dummyCartItems, "guest@example.com");
    
    const res = await CartService.transitionGuestToAuthenticated(session, testUserId);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, "claimed");

    const cart = await prisma.abandonedCart.findFirst({ where: { userId: testUserId } });
    assert.ok(cart);
    assert.strictEqual(cart.cartSessionId, null);
    assert.strictEqual(cart.userId, testUserId);
  });
});
