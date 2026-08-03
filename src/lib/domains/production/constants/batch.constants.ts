export const BATCH_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  CLOSED: 'closed',
  QUARANTINED: 'quarantined',
} as const;

export const VALID_BATCH_STATES = Object.values(BATCH_STATUS);
