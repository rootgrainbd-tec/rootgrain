import { OptimizationContract } from '../contracts/optimization.contract';

export interface OptimizationPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
