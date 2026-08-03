import { BenchmarkValidator } from "../validators/benchmark.validator";
import { PolicyResolver } from "../../resolvers/policy-resolver";
import { MockRepository } from "../mocks/repository.mock";
import { AuthorizationContextFixture } from "../fixtures/authorization-context.fixture";
import { PolicyFixture } from "../fixtures/policy.fixture";

export class PolicyBenchmark {
  static async run(): Promise<void> {
    const mockRepo = new MockRepository();
    mockRepo.save("policies", [PolicyFixture.requireAdmin]);
    const resolver = new PolicyResolver(mockRepo as any);
    const context = AuthorizationContextFixture.defaultAdmin;

    const duration = await BenchmarkValidator.measure(async () => {
      await resolver.evaluate(context);
    }, 1000);

    BenchmarkValidator.assertPerformanceBound(duration, 100);
  }
}
