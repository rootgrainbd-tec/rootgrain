import { EndpointSecurityConfig } from '../registry/endpoint-security.registry';
import { PolicyValidator } from '../validators/policy.validator';
import { PermissionPolicy } from './permission.policy';
import { SecurityException } from '../exceptions/security.exception';

export class SecurityPolicy {
  static validate(config: EndpointSecurityConfig): void {
    PolicyValidator.validateConfig(config);
    if (config.permissions) {
      for (const p of config.permissions) {
         if (!PermissionPolicy.isValidRequirement(p)) {
            throw SecurityException.configError(`Invalid permission mapping: ${p.resource}:${p.action}`);
         }
      }
    }
  }
}
