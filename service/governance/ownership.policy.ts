export interface OwnershipPolicy {
  readonly policy_id: string;
  readonly required_roles: ReadonlyArray<string>;
}
