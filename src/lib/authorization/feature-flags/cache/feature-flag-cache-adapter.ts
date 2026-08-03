import { IFeatureFlagCache } from "../contracts/feature-flag-cache";
import { FeatureFlagDecision } from "../types/feature-flag-decision";
import { ICacheProvider } from "../../cache/contracts/cache-provider";
import { FEATURE_FLAG_CONSTANTS } from "../constants/feature-flag.constants";

export class FeatureFlagCacheAdapter implements IFeatureFlagCache {
  constructor(private cacheProvider: ICacheProvider) {}

  private generateKey(key: string, contextHash: string): string {
    return `ff:${key}:${contextHash}`;
  }

  async getDecision(key: string, contextHash: string): Promise<FeatureFlagDecision | null> {
    const fullKey = this.generateKey(key, contextHash);
    return await this.cacheProvider.get<FeatureFlagDecision>(fullKey);
  }

  async setDecision(key: string, contextHash: string, decision: FeatureFlagDecision): Promise<void> {
    const fullKey = this.generateKey(key, contextHash);
    await this.cacheProvider.set(fullKey, decision, FEATURE_FLAG_CONSTANTS.CACHE_TTL_MS);
  }
}
