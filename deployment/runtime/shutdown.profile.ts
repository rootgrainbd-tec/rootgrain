export interface ShutdownProfile {
  readonly termination_grace_period_ms: number;
  readonly drain_timeout_ms: number;
}
