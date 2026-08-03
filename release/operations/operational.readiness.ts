export interface OperationalReadiness {
  readonly readiness_id: string;
  readonly release_id: string;
  readonly checklist_id: string;
  readonly validation_status: 'VALIDATED' | 'UNVALIDATED';
}
