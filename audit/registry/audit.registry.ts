import { AuditContract } from '../contracts/audit.contract';
import { ComplianceContract } from '../contracts/compliance.contract';
import { AuditException } from '../exceptions/audit.exception';

export class AuditRegistry {
  private static audits = new Map<string, AuditContract>();
  private static compliance = new Map<string, ComplianceContract>();

  static registerAudit(contract: AuditContract): void {
     if (this.audits.has(contract.audit_id)) throw AuditException.validation("Duplicate Audit ID");
     this.audits.set(contract.audit_id, contract);
  }

  static registerCompliance(contract: ComplianceContract): void {
     if (this.compliance.has(contract.compliance_id)) throw AuditException.validation("Duplicate Compliance ID");
     this.compliance.set(contract.compliance_id, contract);
  }
}
