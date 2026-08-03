import { InsightContract } from './insight.contract';
import { DataException } from '../exceptions/data.exception';

export class IntelligenceValidator {
  static validateInsight(insight: InsightContract): void {
     if (insight.confidence_score < 0 || insight.confidence_score > 100) {
        throw DataException.failClosed("Insight confidence score must be between 0 and 100");
     }
  }
}
