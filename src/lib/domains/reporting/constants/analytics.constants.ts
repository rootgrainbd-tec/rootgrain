export const ANALYTICS_METRIC_TYPES = {
  COUNT: 'count',
  SUM: 'sum',
  AVERAGE: 'average',
  MINIMUM: 'minimum',
  MAXIMUM: 'maximum',
  RATIO: 'ratio',
} as const;

export const VALID_ANALYTICS_METRIC_TYPES = Object.values(ANALYTICS_METRIC_TYPES);
