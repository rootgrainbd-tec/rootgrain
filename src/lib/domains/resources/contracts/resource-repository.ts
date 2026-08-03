import { Resource, ResourceIdentity } from '../types/resource';
import { ResourceCategory } from '../types/resource-category';

export interface ResourceRepository {
  findById(id: string): Promise<Resource | null>;
  findBySku(sku: string): Promise<Resource | null>;
  findManyByCategory(category: ResourceCategory): Promise<Resource[]>;
  save(resource: Resource): Promise<Resource>;
  update(id: string, resource: Partial<Resource>): Promise<Resource>;
  delete(id: string): Promise<void>;
}
