export interface ApprovalPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
