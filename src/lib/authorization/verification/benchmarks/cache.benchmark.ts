import { BenchmarkValidator } from "../validators/benchmark.validator";
import { MockCache } from "../mocks/cache.mock";

export class CacheBenchmark {
  static async run(): Promise<void> {
    const cache = new MockCache();
    await cache.set("test-key", { allow: true });

    const duration = await BenchmarkValidator.measure(async () => {
      await cache.get("test-key");
    }, 5000);

    // Map lookups should be nearly instantaneous
    BenchmarkValidator.assertPerformanceBound(duration, 50);
  }
}
