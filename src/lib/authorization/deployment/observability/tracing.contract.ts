export interface ITracingContract {
  startSpan(name: string, tags?: Record<string, string>): void;
  endSpan(name: string): void;
  setError(name: string, error: Error): void;
}
