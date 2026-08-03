import { OptimizationContract } from '../contracts/optimization.contract';

export interface OptimizationStrategy {
  readonly strategy_id: string;
  readonly contract: OptimizationContract;
  readonly steps: ReadonlyArray<string>;
}
