export class CacheHealth {
  static check(): { status: 'up' | 'down', reason?: string } {
    // Isolated health check for cache abstraction
    return { status: 'up' };
  }
}
