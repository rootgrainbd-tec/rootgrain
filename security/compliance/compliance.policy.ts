import { PolicyContract } from '../governance/policy.contract';

export interface CompliancePolicy extends PolicyContract {
  readonly compliance_framework: string; // e.g., SOC2, GDPR, HIPAA abstractly
}
