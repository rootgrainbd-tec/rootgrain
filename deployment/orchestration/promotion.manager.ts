import { PromotionContract } from '../promotion/promotion.contract';
import { PromotionValidator } from '../validation/promotion.validator';

export class PromotionManager {
  static initiatePromotion(contract: PromotionContract): void {
     PromotionValidator.validate(contract);
  }
}
