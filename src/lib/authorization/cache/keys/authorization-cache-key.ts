export type AuthorizationCacheCategory = "permission" | "policy" | "ownership" | "audit";

export class AuthorizationCacheKey {
  static generate(category: AuthorizationCacheCategory, identifier: string): string {
    return `authorization:${category}:${identifier}`;
  }
}
