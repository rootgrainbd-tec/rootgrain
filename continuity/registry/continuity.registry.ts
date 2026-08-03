import { BackupPolicy } from '../backup/backup.policy';
import { RecoveryStrategy } from '../recovery/recovery.strategy';
import { DisasterContract } from '../disaster/disaster.contract';
import { ContinuityException } from '../exceptions/continuity.exception';

export class ContinuityRegistry {
  private static backups = new Map<string, BackupPolicy>();
  private static recoveries = new Map<string, RecoveryStrategy>();
  private static disasters = new Map<string, DisasterContract>();

  static registerBackup(policy: BackupPolicy): void {
     if (this.backups.has(policy.policy_id)) throw ContinuityException.validation("Duplicate Backup ID");
     this.backups.set(policy.policy_id, policy);
  }

  static registerRecovery(strategy: RecoveryStrategy): void {
     if (this.recoveries.has(strategy.strategy_id)) throw ContinuityException.validation("Duplicate Recovery ID");
     this.recoveries.set(strategy.strategy_id, strategy);
  }

  static registerDisaster(scenario: DisasterContract): void {
     if (this.disasters.has(scenario.scenario_id)) throw ContinuityException.validation("Duplicate Disaster Scenario ID");
     this.disasters.set(scenario.scenario_id, scenario);
  }
}
