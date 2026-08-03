import { QueueBootstrap } from '../queue/queue.bootstrap';
import { NotificationBootstrap } from '../notifications/notification.bootstrap';
import { EventBootstrap } from '../events/event.bootstrap';
import { SchedulerBootstrap } from '../scheduler/scheduler.bootstrap';
import { ObservabilityBootstrap } from '../observability/observability.bootstrap';
import { InfrastructureConfig } from '../configuration/infrastructure.config';

export class InfrastructureLoader {
  static loadAll(configs: any[]): void {
     InfrastructureConfig.load(configs);
     
     QueueBootstrap.register();
     NotificationBootstrap.register();
     EventBootstrap.register();
     SchedulerBootstrap.register();
     ObservabilityBootstrap.register();
  }
}
