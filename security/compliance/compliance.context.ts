export interface ComplianceContext {
  readonly compliance_id: string;
  readonly scope: string;
  readonly last_audited: number;
  readonly compliant: boolean;
}
