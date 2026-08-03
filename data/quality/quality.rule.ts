export type QualitySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface QualityRule {
  readonly rule_id: string;
  readonly target_data: string;
  readonly validation_logic: string;
  readonly severity: QualitySeverity;
  readonly enforcement_status: 'ACTIVE' | 'DISABLED';
}
