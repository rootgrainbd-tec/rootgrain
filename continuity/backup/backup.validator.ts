import { BackupPolicy } from './backup.policy';
import { ContinuityException } from '../exceptions/continuity.exception';

export class BackupValidator {
  static validatePolicy(policy: BackupPolicy): void {
     if (!policy.policy_id || !policy.backup_type || !policy.validation_status) {
        throw ContinuityException.validation("Backup policy missing identifiers");
     }
  }
}
