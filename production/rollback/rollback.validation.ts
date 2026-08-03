import { RollbackPlan } from './rollback.plan';
import { ProductionException } from '../exceptions/production.exception';

export class RollbackValidation {
  static validate(plan: RollbackPlan): void {
     if (!plan.target_release) {
        throw ProductionException.failClosed("Rollback Validation Failed: Target release is undefined.");
     }
     if (!plan.recovery_steps || plan.recovery_steps.length === 0) {
        throw ProductionException.failClosed("Rollback Validation Failed: Recovery steps are missing.");
     }
     if (plan.validation_status !== 'VALIDATED') {
        throw ProductionException.failClosed("Rollback Validation Failed: Rollback plan is not validated.");
     }
  }
}
