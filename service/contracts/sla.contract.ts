export type SlaStatus = 'DRAFT' | 'ACTIVE' | 'REVIEWING' | 'EXPIRED';

export interface SlaContract {
  readonly sla_id: string;
  readonly service_scope: string;
  readonly response_target: string;
  readonly resolution_target: string;
  readonly status: SlaStatus;
}
