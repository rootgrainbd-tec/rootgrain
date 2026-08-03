export const RESOURCE_CATEGORIES = {
  RAW_MATERIAL: 'raw_material',
  FINISHED_PRODUCT: 'finished_product',
  SEMI_FINISHED_PRODUCT: 'semi_finished_product',
  CONSUMABLE: 'consumable',
  PACKAGING_MATERIAL: 'packaging_material',
  TOOL: 'tool',
  EQUIPMENT: 'equipment',
} as const;

export const VALID_CATEGORIES = Object.values(RESOURCE_CATEGORIES);
