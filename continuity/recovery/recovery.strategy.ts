import { RecoveryContract } from './recovery.contract';

export interface RecoveryStrategy {
  readonly strategy_id: string;
  readonly recovery_contract: RecoveryContract;
  readonly rto_minutes: number;
  readonly rpo_minutes: number;
}
