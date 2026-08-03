export interface AuditPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
