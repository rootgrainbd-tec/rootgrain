export enum AuditState {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  RECORDED = 'RECORDED',
  FAILED = 'FAILED'
}

export interface ObservabilityContext {
  readonly auditId: string;
  readonly state: AuditState;
  readonly error?: string;
  readonly timestamp: number;
}
