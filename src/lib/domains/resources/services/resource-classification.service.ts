import { ResourceCategory } from '../types/resource-category';
import { VALID_CATEGORIES } from '../constants/category.constants';
import { ResourceException } from '../exceptions/resource.exception';

export class ResourceClassificationService {
  static classifyByAttributes(attributes: Record<string, any>): ResourceCategory {
    // Deterministic classification logic
    if (attributes['is_raw_material']) return 'raw_material';
    if (attributes['is_consumable']) return 'consumable';
    
    throw new ResourceException('Cannot determine category from attributes', 'CLASSIFICATION_FAILED');
  }

  static validateCategoryTransition(from: ResourceCategory, to: ResourceCategory): boolean {
    if (from === to) return true;
    if (from === 'raw_material' && to === 'semi_finished_product') return true;
    return false; // Fail closed
  }
}
