export const MOVEMENT_TYPES = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment',
  CONSUMPTION: 'consumption',
} as const;

export const VALID_MOVEMENT_TYPES = Object.values(MOVEMENT_TYPES);
