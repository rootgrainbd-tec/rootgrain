export const PRODUCTION_STATUS = {
  PLANNED: 'planned',
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
} as const;

export const VALID_PRODUCTION_STATES = Object.values(PRODUCTION_STATUS);

export const OUTPUT_TYPES = {
  FINISHED_PRODUCT: 'finished_product',
  SEMI_FINISHED_PRODUCT: 'semi_finished_product',
  BY_PRODUCT: 'by_product',
  SCRAP: 'scrap',
} as const;

export const VALID_OUTPUT_TYPES = Object.values(OUTPUT_TYPES);
