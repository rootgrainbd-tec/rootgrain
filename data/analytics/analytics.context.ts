import { AnalyticsContract } from './analytics.contract';

export interface AnalyticsContext {
  readonly context_id: string;
  readonly base_contract: AnalyticsContract;
  readonly evaluation_frequency: string;
}
