export interface ProductionReadiness {
  readonly readiness_id: string;
  readonly release_id: string;
  readonly application_health: 'PASS' | 'FAIL';
  readonly security_readiness: 'PASS' | 'FAIL';
  readonly backup_readiness: 'PASS' | 'FAIL';
  readonly monitoring_readiness: 'PASS' | 'FAIL';
  readonly configuration_readiness: 'PASS' | 'FAIL';
  readonly release_readiness: 'PASS' | 'FAIL';
}
