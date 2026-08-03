import { FeatureFlagDecision } from "../types/feature-flag-decision";
import { RolloutContext } from "../types/rollout-context";
import { IFeatureFlagProvider } from "../contracts/feature-flag-provider";
import { IFeatureFlagCache } from "../contracts/feature-flag-cache";
import { DefaultStrategy } from "./default-strategy";
import { FailClosedStrategy } from "./fail-closed-strategy";

export class RolloutStrategy {
  private defaultStrategy = new DefaultStrategy();

  constructor(
    private provider: IFeatureFlagProvider,
    private cache: IFeatureFlagCache
  ) {}

  private generateContextHash(context: RolloutContext): string {
    // Simple stable hash of the context for cache keys
    let str = context.identifier;
    const keys = Object.keys(context.attributes).sort();
    for (const k of keys) {
      str += `|${k}:${context.attributes[k]}`;
    }
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  async evaluate(key: string, context: RolloutContext): Promise<FeatureFlagDecision> {
    const contextHash = this.generateContextHash(context);

    // 1. Check cache
    try {
      const cached = await this.cache.getDecision(key, contextHash);
      if (cached) return cached;
    } catch {
      // Ignore cache failures
    }

    // 2. Fetch flag
    let flag;
    try {
      flag = await this.provider.getFlag(key);
      if (!flag) {
        return FailClosedStrategy.getDecision(key, "FLAG_NOT_FOUND");
      }
    } catch {
      return FailClosedStrategy.getDecision(key, "PROVIDER_EXCEPTION");
    }

    // 3. Evaluate
    const decision = this.defaultStrategy.evaluate(flag, context);

    // 4. Cache and return
    try {
      if (decision.reason === "STRATEGY_EVALUATED") {
        await this.cache.setDecision(key, contextHash, decision);
      }
    } catch {
      // Ignore cache set failures
    }

    return decision;
  }
}
