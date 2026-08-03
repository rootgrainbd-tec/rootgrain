import { TaskState, ExecutionContext } from './execution.context';
import { TaskException } from '../exceptions/task.exception';

export class LifecycleManager {
  static transition(context: ExecutionContext, newState: TaskState): ExecutionContext {
    const validTransitions: Record<TaskState, TaskState[]> = {
      [TaskState.CREATED]: [TaskState.QUEUED, TaskState.CANCELLED],
      [TaskState.QUEUED]: [TaskState.RUNNING, TaskState.CANCELLED],
      [TaskState.RUNNING]: [TaskState.COMPLETED, TaskState.FAILED, TaskState.RETRYING],
      [TaskState.RETRYING]: [TaskState.QUEUED, TaskState.CANCELLED],
      [TaskState.COMPLETED]: [],
      [TaskState.FAILED]: [],
      [TaskState.CANCELLED]: []
    };

    if (!validTransitions[context.state].includes(newState)) {
      throw TaskException.lifecycle(`Invalid transition from ${context.state} to ${newState}`, { taskId: context.taskId });
    }

    return Object.freeze({
      ...context,
      state: newState
    });
  }
}
