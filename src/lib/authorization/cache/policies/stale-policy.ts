import { AuthorizationCacheCategory } from "../keys/authorization-cache-key";

export class StalePolicy {
  static allowStaleOnFailure(category: AuthorizationCacheCategory): boolean {
    // Fail-closed architecture demands we do not serve stale data for sensitive authorization checks
    return false;
  }
}
