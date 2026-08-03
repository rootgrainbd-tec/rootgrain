export interface ContinuityAudit {
  readonly audit_id: string;
  readonly continuity_id: string;
  readonly timestamp: number;
  readonly verified: boolean;
}
