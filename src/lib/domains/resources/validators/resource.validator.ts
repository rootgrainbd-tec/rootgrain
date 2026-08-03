import { Resource, ResourceIdentity } from '../types/resource';
import { ValidationException } from '../exceptions/validation.exception';
import { VALID_CATEGORIES } from '../constants/category.constants';
import { RESOURCE_LIFECYCLE_STATES } from '../constants/resource.constants';

export class ResourceValidator {
  static validateIdentity(identity: Partial<ResourceIdentity>): ResourceIdentity {
    const errors: Record<string, string[]> = {};

    if (!identity.id || typeof identity.id !== 'string') errors['id'] = ['Required'];
    if (!identity.sku || typeof identity.sku !== 'string') errors['sku'] = ['Required'];
    if (!identity.name || typeof identity.name !== 'string') errors['name'] = ['Required'];
    if (!identity.slug || typeof identity.slug !== 'string') errors['slug'] = ['Required'];

    if (Object.keys(errors).length > 0) {
      throw new ValidationException('Invalid resource identity', errors);
    }

    return Object.freeze({ ...identity }) as ResourceIdentity;
  }

  static validate(resource: Partial<Resource>): Resource {
    const errors: Record<string, string[]> = {};

    if (!resource.category || !VALID_CATEGORIES.includes(resource.category)) {
      errors['category'] = [`Must be a valid category: ${VALID_CATEGORIES.join(', ')}`];
    }

    if (!resource.status || !RESOURCE_LIFECYCLE_STATES.includes(resource.status)) {
      errors['status'] = [`Must be a valid status: ${RESOURCE_LIFECYCLE_STATES.join(', ')}`];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationException('Invalid resource base properties', errors);
    }

    return Object.freeze({ ...resource }) as Resource;
  }
}
