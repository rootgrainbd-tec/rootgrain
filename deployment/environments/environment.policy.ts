export interface EnvironmentPolicy {
  readonly requires_approval: boolean;
  readonly allowed_promotion_targets: ReadonlyArray<string>;
}
