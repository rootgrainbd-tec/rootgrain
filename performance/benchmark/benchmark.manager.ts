import { BenchmarkContract } from '../contracts/benchmark.contract';
import { BenchmarkWorkflow } from './benchmark.workflow';

export class BenchmarkManager {
  static run(contract: BenchmarkContract): BenchmarkContract {
     return BenchmarkWorkflow.execute(contract);
  }
}
