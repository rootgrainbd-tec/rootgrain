import { MetricContract } from '../monitoring/metric.contract';

export class MetricRegistry {
  private static metrics = new Map<string, MetricContract>();

  static register(metric: MetricContract): void {
     if (!metric.metric_id) throw new Error("Metric requires ID");
     this.metrics.set(metric.metric_id, metric);
  }

  static get(id: string): MetricContract | undefined {
     return this.metrics.get(id);
  }
}
