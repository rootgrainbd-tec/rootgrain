import { TaskContract, TaskStatus } from '../contracts/task.contract';
import { WorkflowException } from '../exceptions/workflow.exception';

export class TaskManager {
  static transitionTask(task: TaskContract, newStatus: TaskStatus): TaskContract {
     if (task.execution_status === 'COMPLETED' || task.execution_status === 'CANCELLED') {
        throw WorkflowException.failClosed("Terminal tasks cannot transition to new states");
     }
     return { ...task, execution_status: newStatus };
  }
}
