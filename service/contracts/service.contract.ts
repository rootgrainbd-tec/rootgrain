export type ServiceStatus = 'PLANNED' | 'ACTIVE' | 'DEGRADED' | 'SUSPENDED' | 'RETIRED';
export type CriticalityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ServiceContract {
  readonly service_id: string;
  readonly service_name: string;
  readonly owner: string;
  readonly scope: string;
  readonly lifecycle_status: ServiceStatus;
  readonly criticality_level: CriticalityLevel;
}
