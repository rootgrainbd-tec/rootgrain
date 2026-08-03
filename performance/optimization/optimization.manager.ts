import { OptimizationContract, OptimizationState } from '../contracts/optimization.contract';

export class OptimizationManager {
  static transition(contract: OptimizationContract, newState: OptimizationState): OptimizationContract {
     return { ...contract, state: newState };
  }
}
