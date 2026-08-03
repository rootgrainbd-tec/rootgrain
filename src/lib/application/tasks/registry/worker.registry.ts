import { WorkerContract } from '../contracts/worker.contract';
import { TaskException } from '../exceptions/task.exception';

export class WorkerRegistry {
  private static workers = new Map<string, WorkerContract>();

  static register(name: string, worker: WorkerContract): void {
    if (this.workers.has(name)) {
      throw TaskException.validation(`Worker ${name} is already registered.`);
    }
    this.workers.set(name, worker);
  }

  static get(name: string): WorkerContract {
    const w = this.workers.get(name);
    if (!w) throw TaskException.validation(`Worker ${name} not found.`);
    return w;
  }
}
