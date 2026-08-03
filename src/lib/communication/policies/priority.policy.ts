export enum NotificationPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}

export class PriorityPolicy {
  static validate(priority: NotificationPriority): boolean {
    return Object.values(NotificationPriority).includes(priority);
  }
}
