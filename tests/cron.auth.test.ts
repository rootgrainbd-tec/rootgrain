import test from "node:test";
import assert from "node:assert";
import module from "node:module";

// @ts-ignore
module.Module._cache[require.resolve('server-only')] = { exports: {} };

// Mock logger to avoid pino-pretty issue in tests
// @ts-ignore
module.Module._cache[require.resolve('../src/lib/logger.ts')] = {
  exports: {
    logger: {
      info: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
      fatal: () => {}
    }
  }
};

import { GET } from "../src/app/api/cron/abandoned-cart/route";
import { CartService } from "../src/services/cart.service";

test('Cron Authentication Hardening Tests', async (t) => {
  let processAbandonedCartsCalled = false;

  // Mock CartService.processAbandonedCarts
  test.mock.method(CartService, 'processAbandonedCarts', async () => {
    processAbandonedCartsCalled = true;
    return { success: true, count: 0 };
  });

  function createRequest(authHeader: string | null) {
    const headers = new Headers();
    if (authHeader !== null) {
      headers.set('authorization', authHeader);
    }
    return new Request('http://localhost:3000/api/cron/abandoned-cart', {
      method: 'GET',
      headers
    });
  }

  const originalCronSecret = process.env.CRON_SECRET;

  t.afterEach(() => {
    processAbandonedCartsCalled = false;
    process.env.CRON_SECRET = originalCronSecret;
  });

  await t.test('TEST 1: CRON_SECRET undefined -> rejected -> business logic NOT called', async () => {
    delete process.env.CRON_SECRET;
    const req = createRequest("Bearer valid-secret");
    const res = await GET(req);
    assert.strictEqual(res.status, 500);
    assert.strictEqual(processAbandonedCartsCalled, false);
  });

  await t.test('TEST 2: CRON_SECRET empty -> rejected -> business logic NOT called', async () => {
    process.env.CRON_SECRET = "";
    const req = createRequest("Bearer valid-secret");
    const res = await GET(req);
    assert.strictEqual(res.status, 500);
    assert.strictEqual(processAbandonedCartsCalled, false);
  });

  await t.test('TEST 3: valid CRON_SECRET but no Authorization -> 401 -> business logic NOT called', async () => {
    process.env.CRON_SECRET = "valid-secret";
    const req = createRequest(null);
    const res = await GET(req);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(processAbandonedCartsCalled, false);
  });

  await t.test('TEST 4: wrong Bearer token -> 401 -> business logic NOT called', async () => {
    process.env.CRON_SECRET = "valid-secret";
    const req = createRequest("Bearer wrong-secret");
    const res = await GET(req);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(processAbandonedCartsCalled, false);
  });

  await t.test('TEST 5: malformed Authorization -> rejected -> business logic NOT called', async () => {
    process.env.CRON_SECRET = "valid-secret";
    const req = createRequest("malformed-token");
    const res = await GET(req);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(processAbandonedCartsCalled, false);
  });

  await t.test('TEST 6: correct Bearer token -> authentication passes', async () => {
    process.env.CRON_SECRET = "valid-secret";
    const req = createRequest("Bearer valid-secret");
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(processAbandonedCartsCalled, true);
  });
});
