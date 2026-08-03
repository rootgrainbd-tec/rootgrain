import { BenchmarkContract } from '../contracts/benchmark.contract';
import { PerformanceException } from '../exceptions/performance.exception';

export class BenchmarkValidator {
  static validate(contract: BenchmarkContract): void {
     if (!contract.benchmark_id || !contract.expected_result) {
        throw PerformanceException.validation("Benchmark missing essential identifiers");
     }
  }
}
