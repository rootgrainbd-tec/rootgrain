export interface SlaPolicy {
  readonly policy_id: string;
  readonly service_id: string;
  readonly boundaries: ReadonlyArray<string>;
}
