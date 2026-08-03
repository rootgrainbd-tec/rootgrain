import { TaskContract, TaskPayload } from '../contracts/task.contract';
import { ApplicationException } from '../exceptions/application.exception';

export class TaskValidator {
  static validate(task: TaskContract<any>, payload: any): void {
    if (!task.validate(payload)) {
      throw ApplicationException.validation(`Invalid payload for task type ${task.type}`, { payload });
    }
  }
}
