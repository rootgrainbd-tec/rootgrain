import { ProductionReadiness } from '../readiness/production.readiness';
import { UserAcceptance } from '../acceptance/user.acceptance';
import { DeploymentCheck } from '../deployment/deployment.check';

import { ReadinessValidator } from '../readiness/readiness.validator';
import { AcceptanceValidator } from '../acceptance/acceptance.validator';
import { DeploymentValidator } from '../deployment/deployment.validator';

export class LaunchValidator {
  static approveGoLive(
      readiness: ProductionReadiness,
      acceptance: UserAcceptance,
      deployment: DeploymentCheck
  ): void {
      // Any throw from these validators immediately blocks go-live
      ReadinessValidator.validate(readiness);
      AcceptanceValidator.validate(acceptance);
      DeploymentValidator.validate(deployment);
  }
}
