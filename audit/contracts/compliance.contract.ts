export type ComplianceStatus = 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT' | 'EXEMPTED';

export interface ComplianceContract {
  readonly compliance_id: string;
  readonly framework: string;
  readonly requirement: string;
  readonly status: ComplianceStatus;
  readonly validation_result: string;
}
