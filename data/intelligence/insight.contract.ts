export interface InsightContract {
  readonly insight_id: string;
  readonly source_metric: string;
  readonly confidence_score: number;
}
