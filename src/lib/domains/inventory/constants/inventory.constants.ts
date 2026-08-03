export const STOCK_STATUS = {
  AVAILABLE: 'available',
  ALLOCATED: 'allocated',
  RESERVED: 'reserved',
  DAMAGED: 'damaged',
  RETURNED: 'returned',
  ARCHIVED: 'archived',
} as const;

export const VALID_STOCK_STATES = Object.values(STOCK_STATUS);
