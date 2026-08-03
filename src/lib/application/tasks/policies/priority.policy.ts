export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export class PriorityPolicy {
  static validate(priority: TaskPriority): boolean {
     return Object.values(TaskPriority).includes(priority);
  }
}
