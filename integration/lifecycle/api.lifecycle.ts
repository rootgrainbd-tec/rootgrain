import { ApiContract, ApiLifecycleStatus } from '../api/api.contract';

export class ApiLifecycle {
  static transition(contract: ApiContract, newStatus: ApiLifecycleStatus): ApiContract {
     return { ...contract, lifecycle_status: newStatus };
  }
}
