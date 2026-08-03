import { AuthorizationCacheCategory } from "../keys/authorization-cache-key";

export class InvalidationPolicy {
  static shouldInvalidateOnWrite(category: AuthorizationCacheCategory): boolean {
    if (category === "permission") return true;
    if (category === "ownership") return true;
    if (category === "policy") return true;
    return false;
  }
}
