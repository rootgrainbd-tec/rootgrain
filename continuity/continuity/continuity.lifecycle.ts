import { ContinuityContract, ContinuityState } from './continuity.contract';

export class ContinuityLifecycle {
  static transition(contract: ContinuityContract, state: ContinuityState): ContinuityContract {
     return { ...contract, state };
  }
}
