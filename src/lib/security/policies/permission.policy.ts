import { PermissionRequirement } from '../registry/endpoint-security.registry';

export class PermissionPolicy {
  static isValidRequirement(req: PermissionRequirement): boolean {
    const validDomains = ['resources', 'inventory', 'production', 'orders', 'accounting', 'reporting'];
    return validDomains.includes(req.resource) && typeof req.action === 'string' && req.action.length > 0;
  }
}
