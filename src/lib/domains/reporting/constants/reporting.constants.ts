export const REPORT_CATEGORIES = {
  INVENTORY: 'inventory',
  PRODUCTION: 'production',
  SALES: 'sales',
  ACCOUNTING: 'accounting',
  OPERATIONAL: 'operational',
  EXECUTIVE: 'executive',
} as const;

export const VALID_REPORT_CATEGORIES = Object.values(REPORT_CATEGORIES);

export const AGGREGATION_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;

export const VALID_AGGREGATION_PERIODS = Object.values(AGGREGATION_PERIODS);
