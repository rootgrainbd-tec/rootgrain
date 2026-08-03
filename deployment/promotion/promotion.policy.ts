import { PromotionContract } from './promotion.contract';

export class PromotionPolicy {
  static isAllowed(contract: PromotionContract): boolean {
     // Enforce linear flow: LOCAL -> DEVELOPMENT -> STAGING -> PRODUCTION
     const flow: Record<string, string> = {
        'LOCAL': 'DEVELOPMENT',
        'DEVELOPMENT': 'STAGING',
        'STAGING': 'PRODUCTION'
     };
     return flow[contract.source_environment] === contract.target_environment;
  }
}
