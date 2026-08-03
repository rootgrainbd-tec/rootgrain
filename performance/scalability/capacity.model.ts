export interface CapacityModel {
  readonly capacity_id: string;
  readonly current_capacity: number;
  readonly projected_capacity: number;
  readonly growth_rate: number;
  readonly risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
