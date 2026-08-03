export interface MetricContract {
  readonly metric_id: string;
  readonly value: number;
  readonly timestamp: number;
  readonly tags: Readonly<Record<string, string>>;
}
