import { HandlerContract } from '../contracts/handler.contract';
import { InvoiceCreatedEvent, PaymentReceivedEvent } from '../schemas/accounting.events';

export class InvoiceCreatedHandler implements HandlerContract<InvoiceCreatedEvent> {
  readonly supportedEventType = 'invoice_created';
  async handle(event: InvoiceCreatedEvent): Promise<void> {}
  validate(event: InvoiceCreatedEvent): boolean { return true; }
}

export class PaymentReceivedHandler implements HandlerContract<PaymentReceivedEvent> {
  readonly supportedEventType = 'payment_received';
  async handle(event: PaymentReceivedEvent): Promise<void> {}
  validate(event: PaymentReceivedEvent): boolean { return true; }
}
