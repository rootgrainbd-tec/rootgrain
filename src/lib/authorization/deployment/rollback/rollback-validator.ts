import { RollbackPlan } from "./rollback-plan";

export class RollbackValidator {
  static validate(plan: RollbackPlan): boolean {
    if (!plan.id || !plan.steps || plan.steps.length === 0) {
      return false;
    }
    return true;
  }
}
