export const DeploymentChecklist = [
  { id: "env_validation", task: "Run environment validator", required: true },
  { id: "config_validation", task: "Run configuration validator", required: true },
  { id: "cache_health", task: "Verify cache health status is UP", required: true },
  { id: "policy_health", task: "Verify policy health status is UP", required: true },
];
