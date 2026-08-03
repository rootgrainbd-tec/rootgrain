export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PermissionContract {
  readonly permission_id: string;
  readonly resource_scope: string;
  readonly action_scope: string;
  readonly risk_level: RiskLevel;
  readonly status: 'ACTIVE' | 'INACTIVE';
}
