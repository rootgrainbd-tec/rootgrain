import { DomainEventContract } from '../contracts/event.contract';

export interface ReportGeneratedPayload {
  reportId: string;
  type: string;
  url: string;
}

export type ReportGeneratedEvent = DomainEventContract<ReportGeneratedPayload>;
