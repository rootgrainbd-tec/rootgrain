import { HandlerContract } from '../contracts/handler.contract';
import { ResourceCreatedEvent, ResourceUpdatedEvent } from '../schemas/resource.events';
import { PayloadValidator } from '../validators/payload.validator';

export class ResourceCreatedHandler implements HandlerContract<ResourceCreatedEvent> {
  readonly supportedEventType = 'resource_created';

  async handle(event: ResourceCreatedEvent): Promise<void> {
     // Stub logic for handling
  }

  validate(event: ResourceCreatedEvent): boolean {
    try {
      PayloadValidator.validate(event.payload, ['resourceId', 'type']);
      return true;
    } catch { return false; }
  }
}

export class ResourceUpdatedHandler implements HandlerContract<ResourceUpdatedEvent> {
  readonly supportedEventType = 'resource_updated';

  async handle(event: ResourceUpdatedEvent): Promise<void> {
     // Stub logic for handling
  }

  validate(event: ResourceUpdatedEvent): boolean {
    try {
      PayloadValidator.validate(event.payload, ['resourceId', 'changes']);
      return true;
    } catch { return false; }
  }
}
