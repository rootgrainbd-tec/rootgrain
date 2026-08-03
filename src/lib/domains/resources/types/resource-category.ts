import { RESOURCE_CATEGORIES } from '../constants/category.constants';

export type ResourceCategory = typeof RESOURCE_CATEGORIES[keyof typeof RESOURCE_CATEGORIES];
