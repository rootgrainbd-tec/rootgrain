export interface PerformanceContract {
  readonly performance_id: string;
  readonly target_system: string;
  readonly environment: string;
  readonly baseline_metrics: Readonly<Record<string, number>>;
  readonly evaluation_status: 'PENDING' | 'EVALUATED' | 'FAILED';
}
