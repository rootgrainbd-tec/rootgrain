export const DOMAIN_EVENTS = {
  RESOURCE_CREATED: 'resource_created',
  INVENTORY_ALLOCATED: 'inventory_allocated',
  PRODUCTION_STARTED: 'production_started',
  PRODUCTION_COMPLETED: 'production_completed',
  ORDER_CREATED: 'order_created',
  ORDER_FULFILLED: 'order_fulfilled',
  INVOICE_CREATED: 'invoice_created',
  PAYMENT_RECEIVED: 'payment_received',
  REPORT_GENERATED: 'report_generated',
} as const;

export const VALID_DOMAIN_EVENTS = Object.values(DOMAIN_EVENTS);
