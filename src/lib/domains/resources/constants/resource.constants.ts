export const RESOURCE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export const RESOURCE_LIFECYCLE_STATES = Object.values(RESOURCE_STATUS);
