import { RoadmapContract } from '../contracts/roadmap.contract';
import { RoadmapPriority } from './roadmap.priority';
import { ProductException } from '../exceptions/product.exception';

export class RoadmapValidator {
  static validate(item: RoadmapContract, priority: RoadmapPriority): void {
      if (!priority.strategic_alignment) {
          throw ProductException.failClosed("Roadmap Validation Failed: Item lacks strategic alignment.");
      }
      if (priority.requires_measurable_impact && item.impact_score <= 0) {
          throw ProductException.failClosed("Roadmap Validation Failed: Measurable impact score must be greater than zero.");
      }
      if (item.effort_score <= 0) {
          throw ProductException.failClosed("Roadmap Validation Failed: Effort evaluation is missing or zero.");
      }
  }
}
