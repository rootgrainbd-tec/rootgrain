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
import prisma from "../src/lib/prisma";
import { generateCartSessionId } from "../src/lib/cart-session";
import { ValidCartIdentity } from "../src/types/cart";

test('BUG 1: Abandoned Cart Recovery Dead Code Proof', async (t) => {
  t.beforeEach(async () => {
    await prisma.abandonedCart.deleteMany({});
  });

  t.after(async () => {
    await prisma.abandonedCart.deleteMany({});
  });

  await t.test('An abandoned cart with an email should be eligible for recovery', async () => {
    const session = generateCartSessionId();
    const identity: ValidCartIdentity = { kind: "guest", cartSessionId: session };
    const email = "abandoned@example.com";
    
    // Simulate user adding an item to the cart and providing an email
    await CartRepository.upsertCart(identity, [{ productId: "test-product", quantity: 1 }], email);

    // Fast forward time to simulate cart abandonment (25 hours ago)
    await prisma.abandonedCart.update({
      where: { cartSessionId: session },
      data: {
        lastActive: new Date(Date.now() - 25 * 60 * 60 * 1000)
      }
    });

    // The cron job runs and looks for carts older than 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const eligibleCarts = await CartRepository.findAbandonedCartsBefore(cutoffTime);

    // If the bug exists, eligibleCarts will be empty because isRecoveryEligible is false
    assert.strictEqual(
      eligibleCarts.length, 
      1, 
      "The cart should be found by the cron job, but isRecoveryEligible was false!"
    );
  });
});
