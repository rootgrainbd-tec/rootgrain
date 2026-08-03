import { FeatureContract } from '../contracts/feature.contract';
import { ProductException } from '../exceptions/product.exception';

export class FeatureValidator {
  static validate(feature: FeatureContract): void {
      if (!feature.feature_name) {
          throw ProductException.failClosed("Feature Validation Failed: Missing feature name.");
      }
      if (!feature.customer_value) {
          throw ProductException.failClosed("Feature Validation Failed: Customer value must be explicitly defined.");
      }
  }
}
