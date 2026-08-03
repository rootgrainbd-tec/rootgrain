import { TaskContract, TaskStatus } from '../contracts/task.contract';

export class ExecutionLifecycle {
  static transition(contract: TaskContract, newStatus: TaskStatus): TaskContract {
     return { ...contract, execution_status: newStatus };
  }
}
