import { PartnerContract } from '../ecosystem/partner.contract';

export class PartnerLifecycle {
  static transition(contract: PartnerContract, status: 'ACTIVE' | 'SUSPENDED'): PartnerContract {
     return { ...contract, status };
  }
}
