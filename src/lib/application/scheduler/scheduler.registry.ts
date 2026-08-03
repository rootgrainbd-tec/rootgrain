import { SchedulerContract } from './scheduler.contract';
import { ApplicationException } from '../exceptions/application.exception';

export class SchedulerRegistry {
  private static instance: SchedulerContract | null = null;

  static register(scheduler: SchedulerContract): void {
    if (this.instance) {
      throw ApplicationException.validation('Scheduler is already registered.');
    }
    this.instance = scheduler;
  }

  static get(): SchedulerContract {
    if (!this.instance) {
      throw ApplicationException.validation('Scheduler is not registered.');
    }
    return this.instance;
  }
}
