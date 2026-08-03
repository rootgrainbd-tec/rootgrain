export interface AuditContract<TMetadata = any> {
  readonly id: string;
  readonly type: string;
  readonly actor: string;
  readonly action: string;
  readonly resource: string;
  readonly metadata: Readonly<TMetadata>;
  readonly timestamp: number;
}
