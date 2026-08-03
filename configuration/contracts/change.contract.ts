export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ChangeStatus = 'CREATED' | 'REVIEWING' | 'APPROVED' | 'IMPLEMENTING' | 'VALIDATING' | 'COMPLETED' | 'REJECTED' | 'ROLLED_BACK';

export interface ChangeContract {
  readonly change_id: string;
  readonly requester: string;
  readonly target_configuration: string;
  readonly impact_level: ImpactLevel;
  readonly approval_status: ChangeStatus;
}
