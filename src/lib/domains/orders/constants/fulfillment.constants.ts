export const FULFILLMENT_STATUS = {
  PENDING: 'pending',
  PICKING: 'picking',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  FAILED: 'failed',
} as const;

export const VALID_FULFILLMENT_STATES = Object.values(FULFILLMENT_STATUS);
