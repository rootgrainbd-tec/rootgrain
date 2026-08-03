export interface DeploymentCheck {
  readonly check_id: string;
  readonly package_integrity: 'PASS' | 'FAIL';
  readonly environment_compatibility: 'PASS' | 'FAIL';
  readonly configuration_consistency: 'PASS' | 'FAIL';
  readonly rollback_readiness: 'PASS' | 'FAIL';
}
