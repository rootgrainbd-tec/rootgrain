export type GovernanceStatus = 'ACTIVE' | 'DRAFT' | 'RETIRED';

export interface GovernanceContract {
  readonly governance_id: string;
  readonly policy_version: string;
  readonly owner: string;
  readonly scope: string;
  readonly created_at: number;
  readonly status: GovernanceStatus;
}
