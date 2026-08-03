export interface MetricInformation {
  value: number;
  average: number;
  minimum: number;
  maximum: number;
}

export interface TrendInformation {
  growth_rate: number;
  variance: number;
  deviation: number;
}

export interface DashboardMetric {
  id: string;
  name: string;
  category: string;
  metric: MetricInformation;
  trend: TrendInformation;
  calculated_at: Date;
}
