export type PolicyType = 'ACCESS_POLICY' | 'DATA_POLICY' | 'OPERATIONAL_POLICY' | 'COMPLIANCE_POLICY';
export type EnforcementLevel = 'STRICT' | 'AUDIT_ONLY';
export type ApprovalState = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PolicyContract {
  readonly policy_id: string;
  readonly policy_type: PolicyType;
  readonly rules: ReadonlyArray<string>;
  readonly enforcement_level: EnforcementLevel;
  readonly approval_state: ApprovalState;
}
