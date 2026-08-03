export interface ICacheSerializer {
  serialize<T>(data: T): string;
  deserialize<T>(data: string): T | null;
}
