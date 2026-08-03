export interface RecoveryAudit {
  readonly audit_id: string;
  readonly strategy_id: string;
  readonly timestamp: number;
  readonly verified: boolean;
}
