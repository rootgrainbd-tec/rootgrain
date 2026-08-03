export interface TaskMetricsContract {
  readonly processedCount: number;
  readonly failedCount: number;
  readonly averageDurationMs: number;
  readonly activeWorkers: number;
}
