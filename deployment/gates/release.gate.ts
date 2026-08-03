import { DeploymentGate } from './deployment.gate';
import { RolloutContract } from '../rollout/rollout.contract';

export class ReleaseGate implements DeploymentGate {
  async evaluate(rollout: RolloutContract): Promise<boolean> {
     return true; // Stub
  }
}
