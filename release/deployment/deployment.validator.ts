import { DeploymentCheck } from './deployment.check';

export class DeploymentValidator {
  static validate(check: DeploymentCheck): void {
      const isValid = (
          check.package_integrity === 'PASS' &&
          check.environment_compatibility === 'PASS' &&
          check.configuration_consistency === 'PASS' &&
          check.rollback_readiness === 'PASS'
      );

      if (!isValid) {
          throw new Error("Deployment Validation Failed: Critical deployment checks did not pass.");
      }
  }
}
