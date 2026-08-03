import { CompliancePolicy } from './compliance.policy';
import { SecurityException } from '../exceptions/security.exception';

export class ComplianceRegistry {
  private static policies = new Map<string, CompliancePolicy>();

  static register(policy: CompliancePolicy): void {
     if (this.policies.has(policy.policy_id)) {
        throw SecurityException.validation(`Policy ID ${policy.policy_id} already registered`);
     }
     this.policies.set(policy.policy_id, policy);
  }

  static get(id: string): CompliancePolicy {
     const policy = this.policies.get(id);
     if (!policy) throw SecurityException.validation(`Compliance Policy ${id} not found`);
     return policy;
  }
}
