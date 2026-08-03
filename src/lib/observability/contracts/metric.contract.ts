export interface MetricContract {
  readonly name: string;
  readonly value: number;
  readonly tags: Record<string, string>;
  readonly timestamp: number;
}
