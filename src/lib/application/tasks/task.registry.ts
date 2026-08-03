import { TaskContract, TaskPayload } from '../contracts/task.contract';
import { ApplicationException } from '../exceptions/application.exception';

export class TaskRegistry {
  private static tasks = new Map<string, TaskContract<any>>();

  static register(task: TaskContract<any>): void {
    if (this.tasks.has(task.type)) {
      throw ApplicationException.validation(`Task of type ${task.type} is already registered.`);
    }
    this.tasks.set(task.type, task);
  }

  static get(type: string): TaskContract<any> {
    const task = this.tasks.get(type);
    if (!task) {
      throw ApplicationException.validation(`Task of type ${type} not found.`);
    }
    return task;
  }
}
