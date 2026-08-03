export interface ICacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  errors: number;
}

export interface ICacheMetricsProvider {
  getMetrics(): ICacheMetrics;
  recordHit(): void;
  recordMiss(): void;
  recordEviction(): void;
  recordError(): void;
}
