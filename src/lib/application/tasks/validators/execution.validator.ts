import { ExecutionContext } from '../engine/execution.context';
import { TaskException } from '../exceptions/task.exception';

export class ExecutionValidator {
  static validateImmutability(context: ExecutionContext): void {
    if (!Object.isFrozen(context)) {
      throw TaskException.validation('Execution context must be strictly immutable', { taskId: context.taskId });
    }
  }
}
