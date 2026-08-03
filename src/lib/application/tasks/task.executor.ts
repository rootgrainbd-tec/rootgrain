import { TaskRegistry } from './task.registry';
import { TaskValidator } from './task.validator';
import { ApplicationException } from '../exceptions/application.exception';

export class TaskExecutor {
  static async execute(type: string, payload: any): Promise<void> {
    const task = TaskRegistry.get(type);
    
    TaskValidator.validate(task, payload);

    try {
      await task.execute(payload);
    } catch (e: any) {
      throw ApplicationException.taskExecution(`Task execution failed: ${e.message}`, { type, payload });
    }
  }
}
