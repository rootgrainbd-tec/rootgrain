import { BenchmarkValidator } from "../validators/benchmark.validator";
import { OwnershipResolver } from "../../resolvers/ownership-resolver";
import { AuthorizationContextFixture } from "../fixtures/authorization-context.fixture";

export class OwnershipBenchmark {
  static async run(): Promise<void> {
    const resolver = new OwnershipResolver();
    const context = AuthorizationContextFixture.defaultCustomer;
    
    // We mock resource data for ownership locally to test CPU bound constraint
    const resourceData = { ownerId: "customer-1" };

    const duration = await BenchmarkValidator.measure(async () => {
      await resolver.verifyOwnership({ ...context, ownerId: resourceData.ownerId });
    }, 1000);

    // Ensure evaluation doesn't block CPU
    BenchmarkValidator.assertPerformanceBound(duration, 50);
  }
}
