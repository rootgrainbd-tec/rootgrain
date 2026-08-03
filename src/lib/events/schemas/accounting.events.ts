import { DomainEventContract } from '../contracts/event.contract';

export interface InvoiceCreatedPayload {
  invoiceId: string;
  orderId: string;
  amount: number;
}

export type InvoiceCreatedEvent = DomainEventContract<InvoiceCreatedPayload>;

export interface PaymentReceivedPayload {
  paymentId: string;
  invoiceId: string;
  amount: number;
}

export type PaymentReceivedEvent = DomainEventContract<PaymentReceivedPayload>;
