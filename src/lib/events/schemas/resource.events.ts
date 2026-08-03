import { DomainEventContract } from '../contracts/event.contract';

export interface ResourceCreatedPayload {
  resourceId: string;
  type: string;
}

export type ResourceCreatedEvent = DomainEventContract<ResourceCreatedPayload>;

export interface ResourceUpdatedPayload {
  resourceId: string;
  changes: Record<string, any>;
}

export type ResourceUpdatedEvent = DomainEventContract<ResourceUpdatedPayload>;
