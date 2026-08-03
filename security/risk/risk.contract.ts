export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MitigationStatus = 'OPEN' | 'MITIGATED' | 'ACCEPTED';

export interface RiskContract {
  readonly risk_id: string;
  readonly category: string;
  readonly severity: RiskSeverity;
  readonly impact: string;
  readonly mitigation_status: MitigationStatus;
}
