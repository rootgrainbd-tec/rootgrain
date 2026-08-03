import { InsightContract } from './insight.contract';

export interface DecisionModel {
  readonly decision_id: string;
  readonly rules: ReadonlyArray<string>;
  readonly insight: InsightContract;
}
