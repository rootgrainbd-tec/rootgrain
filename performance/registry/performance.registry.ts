import { BenchmarkContract } from '../contracts/benchmark.contract';
import { OptimizationContract } from '../contracts/optimization.contract';
import { PerformanceException } from '../exceptions/performance.exception';

export class PerformanceRegistry {
  private static benchmarks = new Map<string, BenchmarkContract>();
  private static optimizations = new Map<string, OptimizationContract>();

  static registerBenchmark(benchmark: BenchmarkContract): void {
     if (this.benchmarks.has(benchmark.benchmark_id)) {
         throw PerformanceException.validation(`Benchmark ID ${benchmark.benchmark_id} already exists`);
     }
     this.benchmarks.set(benchmark.benchmark_id, benchmark);
  }

  static getBenchmark(id: string): BenchmarkContract {
     const b = this.benchmarks.get(id);
     if (!b) throw PerformanceException.validation(`Benchmark ${id} not found`);
     return b;
  }

  static registerOptimization(optimization: OptimizationContract): void {
     if (this.optimizations.has(optimization.optimization_id)) {
         throw PerformanceException.validation(`Optimization ID ${optimization.optimization_id} already exists`);
     }
     this.optimizations.set(optimization.optimization_id, optimization);
  }
}
