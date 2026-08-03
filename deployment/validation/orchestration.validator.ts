import { OrchestrationContext } from '../orchestration/orchestration.context';

export class OrchestrationValidator {
  static validate(context: OrchestrationContext): void {
     if (!context.deployment_id || !context.environment) {
        throw new Error("Invalid orchestration context");
     }
  }
}
