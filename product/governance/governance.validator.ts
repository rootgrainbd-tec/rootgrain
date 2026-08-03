import { ProductPolicy } from './product.policy';
import { FeaturePolicy } from './feature.policy';
import { ProductException } from '../exceptions/product.exception';

export class GovernanceValidator {
  static validateProductPolicy(policy: ProductPolicy): void {
      if (policy.requires_roi_validation === false) {
          throw ProductException.failClosed("Governance Validation Failed: ROI Validation must be required for all products.");
      }
  }

  static validateFeaturePolicy(policy: FeaturePolicy): void {
      if (!policy.requires_customer_value_mapping || !policy.requires_effort_estimation) {
          throw ProductException.failClosed("Governance Validation Failed: Feature policy must require customer value mapping and effort estimation.");
      }
  }
}
