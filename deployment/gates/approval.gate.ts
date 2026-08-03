import { DeploymentGate } from './deployment.gate';
import { RolloutContract } from '../rollout/rollout.contract';

export class ApprovalGate implements DeploymentGate {
  async evaluate(rollout: RolloutContract): Promise<boolean> {
     return true; // Stub
  }
}
