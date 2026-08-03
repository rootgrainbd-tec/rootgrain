import { RecoveryStrategy } from '../recovery/recovery.strategy';
import { ContinuityException } from '../exceptions/continuity.exception';

export class RecoveryValidator {
  static validate(strategy: RecoveryStrategy): void {
     if (!strategy.strategy_id || !strategy.recovery_contract) {
        throw ContinuityException.validation("Recovery strategy is missing required identifiers");
     }
     if (strategy.rto_minutes < 0 || strategy.rpo_minutes < 0) {
        throw ContinuityException.validation("RTO and RPO must be non-negative");
     }
  }
}
