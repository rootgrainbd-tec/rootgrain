import { FinalRelease } from '../release/final.release';
import { DeploymentValidationState } from '../deployment/deployment.validation';
import { SmokeTest } from '../smoke/smoke.test';
import { RollbackPlan } from '../rollback/rollback.plan';
import { ProductionException } from '../exceptions/production.exception';

import { ReleaseValidator } from '../release/release.validator';
import { DeploymentValidation } from '../deployment/deployment.validation';
import { SmokeValidator } from '../smoke/smoke.validator';
import { RollbackValidation } from '../rollback/rollback.validation';

export class LaunchValidator {
  static validate(
      release: FinalRelease,
      deployment: DeploymentValidationState,
      smokeTests: ReadonlyArray<SmokeTest>,
      rollback: RollbackPlan
  ): void {
      // Any throw from these validators immediately blocks go-live execution
      ReleaseValidator.validate(release);
      DeploymentValidation.validate(deployment);
      SmokeValidator.validate(smokeTests);
      RollbackValidation.validate(rollback);
  }
}
