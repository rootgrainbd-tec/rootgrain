import { RolloutContract } from '../rollout/rollout.contract';
import { RolloutManager } from './rollout.manager';
import { PromotionManager } from './promotion.manager';
import { PromotionContract } from '../promotion/promotion.contract';

export class DeploymentOrchestrator {
  static async orchestratePromotion(promotion: PromotionContract, rollout: RolloutContract): Promise<void> {
     // 1. Validate Promotion Path
     PromotionManager.initiatePromotion(promotion);

     // 2. Execute Rollout
     await RolloutManager.startRollout(rollout);
  }
}
