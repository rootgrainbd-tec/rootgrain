import { RolloutContract } from './rollout.contract';

export class RolloutStrategy {
  static execute(contract: RolloutContract): RolloutContract {
     // Mock state transition
     return { ...contract, state: 'COMPLETED' };
  }
}
