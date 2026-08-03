import { RolloutContract } from '../rollout/rollout.contract';

export interface DeploymentGate {
  evaluate(rollout: RolloutContract): Promise<boolean>;
}
