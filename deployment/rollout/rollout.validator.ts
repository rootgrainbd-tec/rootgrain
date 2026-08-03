import { RolloutContract } from './rollout.contract';

export class RolloutValidator {
  static validate(contract: RolloutContract): void {
     if (!contract.rollout_id || !contract.release_id || !contract.target_environment) {
        throw new Error("Rollout contract missing required identifiers");
     }
  }
}
