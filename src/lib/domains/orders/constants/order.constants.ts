export const ORDER_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PARTIALLY_FULFILLED: 'partially_fulfilled',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
} as const;

export const VALID_ORDER_STATES = Object.values(ORDER_STATUS);

export const ORDER_TYPES = {
  QUOTATION: 'quotation',
  SALES_ORDER: 'sales_order',
  PURCHASE_ORDER: 'purchase_order',
} as const;

export const VALID_ORDER_TYPES = Object.values(ORDER_TYPES);
