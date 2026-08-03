import { ProcessContract } from '../contracts/process.contract';

export class ProcessLifecycle {
  static transition(contract: ProcessContract, status: 'ACTIVE' | 'INACTIVE'): ProcessContract {
     return { ...contract, status };
  }
}
