import { ResourceStatus } from '../types/resource-status';
import { ResourceException } from '../exceptions/resource.exception';

export class ResourceLifecycleService {
  static getNextValidStates(current: ResourceStatus): ResourceStatus[] {
    switch (current) {
      case 'draft': return ['active', 'archived'];
      case 'active': return ['inactive', 'archived'];
      case 'inactive': return ['active', 'archived'];
      case 'archived': return []; // Terminal state
      default: return [];
    }
  }

  static canTransition(from: ResourceStatus, to: ResourceStatus): boolean {
    const validNext = this.getNextValidStates(from);
    return validNext.includes(to);
  }

  static assertTransition(from: ResourceStatus, to: ResourceStatus): void {
    if (!this.canTransition(from, to)) {
      throw new ResourceException(`Invalid lifecycle transition from ${from} to ${to}`, 'INVALID_TRANSITION');
    }
  }
}
