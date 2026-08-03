import { AuditPolicy } from './audit.policy';
import { CompliancePolicy } from './compliance.policy';
import { AuditException } from '../exceptions/audit.exception';

export class PolicyValidator {
  static validateAuditPolicy(policy: AuditPolicy): void {
     if (!policy.policy_id) throw AuditException.validation("Audit policy missing identifiers");
  }

  static validateCompliancePolicy(policy: CompliancePolicy): void {
     if (!policy.policy_id) throw AuditException.validation("Compliance policy missing identifiers");
  }
}
