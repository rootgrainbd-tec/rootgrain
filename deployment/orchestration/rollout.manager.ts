import { RolloutContract } from '../rollout/rollout.contract';
import { RolloutStrategy } from '../rollout/rollout.strategy';
import { RollbackStrategy } from '../rollout/rollback.strategy';

export class RolloutManager {
  static async startRollout(contract: RolloutContract): Promise<RolloutContract> {
     return RolloutStrategy.execute(contract);
  }

  static async abortRollout(contract: RolloutContract): Promise<RolloutContract> {
     return RollbackStrategy.execute(contract);
  }
}
