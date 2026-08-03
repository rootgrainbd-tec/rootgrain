import { z } from "zod";

export const CacheKeyValidator = z.string().regex(/^authorization:(permission|policy|ownership|audit):[a-zA-Z0-9_-]+$/);

export class CacheKeyValidation {
  static isValid(key: string): boolean {
    return CacheKeyValidator.safeParse(key).success;
  }

  static assertValid(key: string): void {
    CacheKeyValidator.parse(key);
  }
}
