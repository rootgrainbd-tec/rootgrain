export class FeatureFlagSerializer {
  static serialize<T>(data: T): string {
    return JSON.stringify(data);
  }

  static deserialize<T>(data: string): T | null {
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
}
