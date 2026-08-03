import { CacheGuard } from "../../middleware/cache.guard";
import { MockCache } from "../mocks/cache.mock";
import { AuthorizationContextFixture } from "../fixtures/authorization-context.fixture";
import { AuthorizationDecisionFixture } from "../fixtures/authorization-decision.fixture";
import { CacheAssertion } from "../assertions/cache.assertion";
import { AuthorizationCacheKey } from "../../cache/keys/authorization-cache-key";
import assert from "assert";

export class CacheIntegration {
  static async verifyCacheBypass(): Promise<void> {
    const mockCache = new MockCache();
    const cacheGuard = new CacheGuard(mockCache);

    const nextFunc = async () => AuthorizationDecisionFixture.explicitAllow;
    
    // Simulate first pass (cache miss)
    await cacheGuard.execute(AuthorizationContextFixture.defaultCustomer, nextFunc);

    // Assert cache was written
    const identifier = `${AuthorizationContextFixture.defaultCustomer.principal}:${AuthorizationContextFixture.defaultCustomer.userId}:${AuthorizationContextFixture.defaultCustomer.resource}:${AuthorizationContextFixture.defaultCustomer.action}`;
    const key = AuthorizationCacheKey.generate("permission", identifier);
    await CacheAssertion.assertKeyExists(mockCache, key);
  }
}
