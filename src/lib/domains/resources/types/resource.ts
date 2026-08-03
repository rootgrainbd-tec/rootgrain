import { ResourceCategory } from './resource-category';
import { ResourceStatus } from './resource-status';
import { Dimensions } from './dimensions';
import { Pricing } from './pricing';

export interface ResourceIdentity {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Resource {
  identity: ResourceIdentity;
  category: ResourceCategory;
  status: ResourceStatus;
  dimensions?: Dimensions;
  pricing?: Pricing;
  created_at: Date;
  updated_at: Date;
}
