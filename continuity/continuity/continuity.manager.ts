import { RecoveryStrategy } from '../recovery/recovery.strategy';
import { ContinuityException } from '../exceptions/continuity.exception';

export class ContinuityManager {
  static enforceRecoveryRules(strategy: RecoveryStrategy): void {
     if (strategy.rto_minutes > 1440 || strategy.rpo_minutes > 1440) {
         // Fails closed if RTO/RPO exceeds 24 hours without an approved exception
         throw ContinuityException.failClosed(`Recovery Plan ${strategy.strategy_id} fails to meet baseline business continuity bounds.`);
     }
  }
}
