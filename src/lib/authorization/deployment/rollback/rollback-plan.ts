export interface RollbackPlan {
  id: string;
  description: string;
  steps: string[];
  revertCondition: string;
}

export class RollbackPlanFactory {
  static createDefaultPlan(): RollbackPlan {
    return {
      id: "auth-rollback-v1",
      description: "Default rollback plan for authorization subsystem",
      steps: [
        "1. Revert feature flag rollout to 0%",
        "2. Disable authorization cache",
        "3. Re-enable legacy authorization endpoints if necessary",
      ],
      revertCondition: "Error rate exceeds 1% or latency exceeds 500ms for 3 consecutive minutes",
    };
  }
}
