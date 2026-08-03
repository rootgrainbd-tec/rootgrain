export interface LaunchChecklist {
  readonly checklist_id: string;
  readonly support_readiness: 'PASS' | 'FAIL';
  readonly incident_response_readiness: 'PASS' | 'FAIL';
  readonly documentation_availability: 'PASS' | 'FAIL';
  readonly ownership_assignment: 'PASS' | 'FAIL';
  readonly recovery_readiness: 'PASS' | 'FAIL';
}
