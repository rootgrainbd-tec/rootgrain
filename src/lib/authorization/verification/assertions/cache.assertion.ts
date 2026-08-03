import assert from "assert";
import { MockCache } from "../mocks/cache.mock";

export class CacheAssertion {
  static async assertKeyExists(cache: MockCache, key: string): Promise<void> {
    const value = await cache.get(key);
    assert.ok(value !== null, `Expected cache key ${key} to exist`);
  }

  static async assertKeyMissing(cache: MockCache, key: string): Promise<void> {
    const value = await cache.get(key);
    assert.ok(value === null, `Expected cache key ${key} to be missing`);
  }
}
