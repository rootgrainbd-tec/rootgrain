import { QualityRule } from './quality.rule';
import { DataException } from '../exceptions/data.exception';

export class QualityValidator {
  static validateRule(rule: QualityRule): void {
     if (!rule.rule_id || !rule.target_data || !rule.severity) {
        throw DataException.validation("Quality rule missing required properties");
     }
     if (rule.severity === 'CRITICAL' && rule.enforcement_status === 'DISABLED') {
        throw DataException.failClosed("Critical quality rules cannot be disabled");
     }
  }
}
