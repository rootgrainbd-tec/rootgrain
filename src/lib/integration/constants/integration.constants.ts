export const INTEGRATION_DOMAINS = {
  RESOURCES: 'resources',
  INVENTORY: 'inventory',
  PRODUCTION: 'production',
  ORDERS: 'orders',
  ACCOUNTING: 'accounting',
  REPORTING: 'reporting',
} as const;

export const VALID_INTEGRATION_DOMAINS = Object.values(INTEGRATION_DOMAINS);
