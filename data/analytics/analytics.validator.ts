import { AnalyticsContract } from './analytics.contract';
import { DataException } from '../exceptions/data.exception';

export class AnalyticsValidator {
  static validate(contract: AnalyticsContract): void {
     if (!contract.analytics_id || !contract.metric_name || !contract.calculation_rule) {
        throw DataException.validation("Analytics contract missing required properties");
     }
  }
}
