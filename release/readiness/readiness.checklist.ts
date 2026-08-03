export interface ReadinessChecklist {
  readonly checklist_id: string;
  readonly required_checks: ReadonlyArray<string>;
  readonly completed_checks: ReadonlyArray<string>;
}
