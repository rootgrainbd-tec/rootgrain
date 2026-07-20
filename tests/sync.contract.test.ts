import test from "node:test";
import assert from "node:assert";
import module from "node:module";
// @ts-ignore
module.Module._cache[require.resolve('server-only')] = { exports: {} };

import { SyncService } from "../src/services/sync.service";
import { ProductRepository } from "../src/repositories/product.repository";
import { client } from "../sanity/lib/client";
import prisma from "../src/lib/prisma";

// Mock the dependencies
test.mock.method(client, 'withConfig', () => client);

test('SyncService Contract Tests', async (t) => {
  await t.test('missing required field throws safely', async () => {
    test.mock.method(client, 'fetch', async () => ({
      _id: "missing-price",
      name: "Valid Title",
      slug: "valid-slug",
      category: "Valid Category",
      price: null, // missing required field
      wood: "Mahogany",
      image: "https://example.com/image.png"
    }));

    await assert.rejects(
      SyncService.reconcileProductBySanityId("missing-price"),
      /Missing required field: price/
    );
  });

  await t.test('valid payload processes correctly', async () => {
    let upsertCalled = false;
    test.mock.method(ProductRepository, 'upsertProductBySanityId', async (id: string, data: any) => {
      upsertCalled = true;
      assert.strictEqual(id, "valid-id");
      assert.strictEqual(data.name, "Valid Title");
      assert.strictEqual(data.slug, "valid-slug");
      assert.strictEqual(data.category, "Valid Category");
      assert.strictEqual(data.price, 100);
      assert.strictEqual(data.wood, "Mahogany");
      assert.strictEqual(data.image, "https://example.com/image.png");
      assert.strictEqual(data.dimensions, '10" L × 5" W × 2" H');
      return { id: "valid-id" };
    });

    test.mock.method(prisma.product, 'findUnique', async () => null);

    test.mock.method(client, 'fetch', async () => ({
      _id: "valid-id",
      name: "Valid Title",
      slug: "valid-slug",
      category: "Valid Category",
      price: 100,
      wood: "Mahogany",
      image: "https://example.com/image.png",
      dimensions: { length: 10, width: 5, height: 2 },
      description: "Short description"
    }));

    const result = await SyncService.reconcileProductBySanityId("valid-id");
    assert.strictEqual(upsertCalled, true);
    assert.strictEqual(result, "CREATED");
  });

  await t.test('absent authoritative product archives', async () => {
    let archiveCalled = false;
    test.mock.method(ProductRepository, 'archiveProductBySanityId', async (id: string) => {
      archiveCalled = true;
      return "ARCHIVED";
    });

    // Simulate returning null for both the first query and the confirmation query
    test.mock.method(client, 'fetch', async () => null);

    const result = await SyncService.reconcileProductBySanityId("absent-id");
    assert.strictEqual(archiveCalled, true);
    assert.strictEqual(result, "ARCHIVED");
  });
});
