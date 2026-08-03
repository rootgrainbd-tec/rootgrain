export type IntegrityStatus = 'VERIFIED' | 'PENDING' | 'INVALID' | 'EXPIRED';

export interface EvidenceContract {
  readonly evidence_id: string;
  readonly source: string;
  readonly evidence_type: string;
  readonly integrity_status: IntegrityStatus;
  readonly retention_policy: string;
}
