export const ReleaseChecklist = [
  { id: "rollout_plan", task: "Verify feature flags are set to 0% initial rollout", required: true },
  { id: "rollback_plan", task: "Verify rollback checklist is accessible to on-call", required: true },
  { id: "observability_hooks", task: "Verify logging and metrics contracts are satisfied", required: true },
];
