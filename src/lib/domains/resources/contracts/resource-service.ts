import { Resource } from '../types/resource';

export interface ResourceServiceContract {
  create(resource: Partial<Resource>): Promise<Resource>;
  update(id: string, updates: Partial<Resource>): Promise<Resource>;
  archive(id: string): Promise<void>;
}
