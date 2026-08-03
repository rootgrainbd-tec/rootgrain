import { ICacheSerializer } from "../contracts/cache-serializer";

export class AuthorizationSerializer implements ICacheSerializer {
  serialize<T>(data: T): string {
    return JSON.stringify(data);
  }

  deserialize<T>(data: string): T | null {
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
}
