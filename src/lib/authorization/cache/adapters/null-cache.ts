import { ICacheProvider } from "../contracts/cache-provider";

export class NullCache implements ICacheProvider {
  async get<T>(key: string): Promise<T | null> {
    return null;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    // No-op fail-closed cache implementation
  }

  async delete(key: string): Promise<void> {
    // No-op
  }

  async clear(): Promise<void> {
    // No-op
  }

  async exists(key: string): Promise<boolean> {
    return false;
  }
}
