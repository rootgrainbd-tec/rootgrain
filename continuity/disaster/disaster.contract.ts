export type DisasterCategory = 'DATA_LOSS' | 'SERVICE_FAILURE' | 'SECURITY_INCIDENT' | 'INFRASTRUCTURE_FAILURE';
export type MitigationStatus = 'OPEN' | 'MITIGATING' | 'RESOLVED';

export interface DisasterContract {
  readonly scenario_id: string;
  readonly category: DisasterCategory;
  readonly impact_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly response_plan: string;
  readonly mitigation_status: MitigationStatus;
}
