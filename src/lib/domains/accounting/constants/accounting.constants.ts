export const ACCOUNTING_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
} as const;

export const VALID_ACCOUNTING_STATES = Object.values(ACCOUNTING_STATUS);

export const PAYMENT_TYPES = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  MOBILE_BANKING: 'mobile_banking',
  CHEQUE: 'cheque',
  ADJUSTMENT: 'adjustment',
} as const;

export const VALID_PAYMENT_TYPES = Object.values(PAYMENT_TYPES);
