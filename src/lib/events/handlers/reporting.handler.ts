import { HandlerContract } from '../contracts/handler.contract';
import { ReportGeneratedEvent } from '../schemas/reporting.events';

export class ReportGeneratedHandler implements HandlerContract<ReportGeneratedEvent> {
  readonly supportedEventType = 'report_generated';
  async handle(event: ReportGeneratedEvent): Promise<void> {}
  validate(event: ReportGeneratedEvent): boolean { return true; }
}
