import { RolloutContract } from './rollout.contract';

export class RollbackStrategy {
  static execute(contract: RolloutContract): RolloutContract {
     return { ...contract, state: 'ROLLING_BACK' };
  }
}
