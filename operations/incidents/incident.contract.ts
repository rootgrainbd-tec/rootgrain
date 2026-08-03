export type IncidentState = 'CREATED' | 'INVESTIGATING' | 'IDENTIFIED' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';

export interface IncidentContract {
  readonly incident_id: string;
  readonly title: string;
  readonly severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
  readonly state: IncidentState;
  readonly created_at: number;
}
