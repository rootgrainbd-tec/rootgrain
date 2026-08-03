import { PromotionContract } from '../promotion/promotion.contract';
import { PromotionPolicy } from '../promotion/promotion.policy';

export class PromotionValidator {
  static validate(contract: PromotionContract): void {
     if (!contract.source_environment || !contract.target_environment) {
        throw new Error("Promotion missing environments");
     }
     if (!PromotionPolicy.isAllowed(contract)) {
        throw new Error(`Invalid promotion path from ${contract.source_environment} to ${contract.target_environment}. No skipping allowed.`);
     }
  }
}
