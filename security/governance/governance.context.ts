import { GovernanceContract } from './governance.contract';

export interface GovernanceContext {
  readonly context_id: string;
  readonly contract: GovernanceContract;
  readonly applied_at: number;
}
