import { QueueContract } from '../contracts/queue.contract';
import { TaskException } from '../exceptions/task.exception';

export class QueueRegistry {
  private static queues = new Map<string, QueueContract>();

  static register(name: string, queue: QueueContract): void {
    if (this.queues.has(name)) {
      throw TaskException.validation(`Queue ${name} is already registered.`);
    }
    this.queues.set(name, queue);
  }

  static get(name: string): QueueContract {
    const q = this.queues.get(name);
    if (!q) throw TaskException.validation(`Queue ${name} not found.`);
    return q;
  }
}
