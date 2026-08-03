import { BackupPolicy } from './backup.policy';
import { ContinuityException } from '../exceptions/continuity.exception';

export class BackupRegistry {
  private static policies = new Map<string, BackupPolicy>();

  static register(policy: BackupPolicy): void {
     if (this.policies.has(policy.policy_id)) {
        throw ContinuityException.validation(`Backup Policy ${policy.policy_id} already registered`);
     }
     this.policies.set(policy.policy_id, policy);
  }

  static get(id: string): BackupPolicy {
     const policy = this.policies.get(id);
     if (!policy) throw ContinuityException.validation(`Backup Policy ${id} not found`);
     return policy;
  }
}
