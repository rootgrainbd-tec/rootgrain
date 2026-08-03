import { BenchmarkValidator } from "../validators/benchmark.validator";
import { PermissionResolver } from "../../resolvers/permission-resolver";
import { MockRepository } from "../mocks/repository.mock";
import { AuthorizationContextFixture } from "../fixtures/authorization-context.fixture";

export class PermissionBenchmark {
  static async run(): Promise<void> {
    const mockRepo = new MockRepository();
    const resolver = new PermissionResolver(mockRepo as any);
    const context = AuthorizationContextFixture.defaultCustomer;

    const duration = await BenchmarkValidator.measure(async () => {
      await resolver.resolve(context);
    }, 1000);

    // Extremely fast in-memory constraint
    BenchmarkValidator.assertPerformanceBound(duration, 50);
  }
}
