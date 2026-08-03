export interface StartupProfile {
  readonly liveness_initial_delay_ms: number;
  readonly liveness_period_ms: number;
  readonly readiness_initial_delay_ms: number;
  readonly readiness_period_ms: number;
}
