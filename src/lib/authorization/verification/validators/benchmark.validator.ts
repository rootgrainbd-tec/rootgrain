import { performance } from "perf_hooks";

export class BenchmarkValidator {
  static async measure(fn: () => Promise<void> | void, iterations: number = 1000): Promise<number> {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    const end = performance.now();
    return end - start;
  }

  static assertPerformanceBound(durationMs: number, maxAllowedMs: number): void {
    if (durationMs > maxAllowedMs) {
      throw new Error(`Performance degradation detected: ${durationMs}ms exceeded bound of ${maxAllowedMs}ms`);
    }
  }
}
