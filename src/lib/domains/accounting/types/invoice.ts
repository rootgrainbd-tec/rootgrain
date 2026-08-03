import { AccountingStatus } from './accounting-status';
import { Payment } from './payment';

export interface InvoicePaymentInfo {
  paid_amount: number;
  due_amount: number;
  outstanding_amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  reference?: string;
  customer_id: string;
  status: AccountingStatus;
  
  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  payment_info: InvoicePaymentInfo;
  payments: Payment[];

  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}
