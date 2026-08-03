import { Resource, ResourceIdentity } from '../types/resource';
import { ResourceCategory } from '../types/resource-category';

export interface ResourceProvider {
  getResource(id: string): Promise<Resource | null>;
  getResourcesByCategory(category: ResourceCategory): Promise<Resource[]>;
  resolveIdentity(sku: string): Promise<ResourceIdentity | null>;
}
