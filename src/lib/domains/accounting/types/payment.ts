import { PAYMENT_TYPES } from '../constants/accounting.constants';

export type PaymentType = typeof PAYMENT_TYPES[keyof typeof PAYMENT_TYPES];

export interface Payment {
  id: string;
  invoice_id: string;
  payment_type: PaymentType;
  amount: number;
  reference?: string;
  payment_date: Date;
}
