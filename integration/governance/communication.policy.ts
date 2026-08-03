export interface CommunicationPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
