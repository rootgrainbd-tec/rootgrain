import { IAuthorizationGuard, NextGuard } from "./types";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";
import { ICacheProvider } from "../cache/contracts/cache-provider";
import { AuthorizationCacheKey } from "../cache/keys/authorization-cache-key";
import { TTL_POLICY } from "../cache/policies/ttl-policy";

export class CacheGuard implements IAuthorizationGuard {
  constructor(private cacheProvider: ICacheProvider) {}

  async execute(context: AuthorizationContext, next: NextGuard): Promise<AuthorizationDecision> {
    const identifier = `${context.principal}:${context.userId || context.sessionId}:${context.resource}:${context.action}`;
    const key = AuthorizationCacheKey.generate("permission", identifier);
    
    const cachedDecision = await this.cacheProvider.get<AuthorizationDecision>(key);
    if (cachedDecision) {
      return cachedDecision;
    }

    const decision = await next();
    
    if (decision.allowed) {
       await this.cacheProvider.set(key, decision, TTL_POLICY.PERMISSION_CACHE_MS);
    }

    return decision;
  }
}
