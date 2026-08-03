import { FeatureLifecycleStatus, FeatureContract } from '../contracts/feature.contract';
import { ProductException } from '../exceptions/product.exception';

export class FeatureLifecycle {
  static transition(feature: FeatureContract, newState: FeatureLifecycleStatus): FeatureContract {
      if (feature.lifecycle_status === 'DEPRECATED') {
          throw ProductException.failClosed("Feature Lifecycle Error: Cannot transition a deprecated feature.");
      }
      
      if (feature.lifecycle_status === 'RELEASED' && (newState === 'IDEA' || newState === 'EVALUATING' || newState === 'APPROVED' || newState === 'DEVELOPING')) {
          throw ProductException.failClosed("Feature Lifecycle Error: Cannot move a released feature backwards in the lifecycle.");
      }

      return {
          ...feature,
          lifecycle_status: newState
      };
  }
}
