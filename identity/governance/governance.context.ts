import { IdentityContract } from '../contracts/identity.contract';

export interface GovernanceContext {
  readonly context_id: string;
  readonly identity: IdentityContract;
}
