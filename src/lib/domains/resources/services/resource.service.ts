import { ResourceServiceContract } from '../contracts/resource-service';
import { Resource } from '../types/resource';
import { ResourceValidator } from '../validators/resource.validator';
import { ResourceRepository } from '../contracts/resource-repository';
import { ResourceException } from '../exceptions/resource.exception';

// AuthorizationMiddleware is required for all mutations, injected via DI or wrapper
export class ResourceService implements ResourceServiceContract {
  constructor(private readonly repository: ResourceRepository) {}

  async create(resourcePayload: Partial<Resource>): Promise<Resource> {
    const validated = ResourceValidator.validate(resourcePayload);
    if (!resourcePayload.identity) throw new ResourceException("Identity required", "MISSING_IDENTITY");
    const validatedIdentity = ResourceValidator.validateIdentity(resourcePayload.identity);
    
    const resource: Resource = {
      ...validated,
      identity: validatedIdentity,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return this.repository.save(resource);
  }

  async update(id: string, updates: Partial<Resource>): Promise<Resource> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ResourceException(`Resource not found: ${id}`, 'NOT_FOUND');
    }
    // Validation would occur here before update
    return this.repository.update(id, updates);
  }

  async archive(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ResourceException(`Resource not found: ${id}`, 'NOT_FOUND');
    }
    await this.repository.update(id, { status: 'archived', updated_at: new Date() });
  }
}
