import { RecoveryContract, RecoveryStatus } from './recovery.contract';

export class RecoveryWorkflow {
  static transition(contract: RecoveryContract, newStatus: RecoveryStatus): RecoveryContract {
     return { ...contract, recovery_status: newStatus };
  }
}
