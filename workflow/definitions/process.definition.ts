import { ProcessContract } from '../contracts/process.contract';

export interface ProcessDefinition {
  readonly process_id: string; // must match ProcessContract
  readonly process_type: string;
  readonly steps: ReadonlyArray<string>;
  readonly transition_rules: ReadonlyArray<string>;
  readonly execution_policy: string;
}
