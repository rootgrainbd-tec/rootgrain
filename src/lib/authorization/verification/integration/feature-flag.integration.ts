import { RolloutStrategy } from "../../feature-flags/strategies/rollout-strategy";
import { MockCache } from "../mocks/cache.mock";
import { FeatureFlagCacheAdapter } from "../../feature-flags/cache/feature-flag-cache-adapter";
import { IFeatureFlagProvider } from "../../feature-flags/contracts/feature-flag-provider";
import { FeatureFlagFixture } from "../fixtures/feature-flag.fixture";
import assert from "assert";

export class FeatureFlagIntegration {
  static async verifyDeterministicRollout(): Promise<void> {
    const mockProvider: IFeatureFlagProvider = {
      getFlag: async () => FeatureFlagFixture.percent50
    };
    
    const cache = new FeatureFlagCacheAdapter(new MockCache());
    const strategy = new RolloutStrategy(mockProvider, cache);

    const result1 = await strategy.evaluate("test", { identifier: "user1", attributes: {} });
    const result2 = await strategy.evaluate("test", { identifier: "user1", attributes: {} });

    assert.strictEqual(result1.enabled, result2.enabled, "Percentage evaluation was not stable across repeated calls");
  }
}
