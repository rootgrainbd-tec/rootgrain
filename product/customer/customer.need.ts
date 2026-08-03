export interface CustomerNeed {
  readonly need_id: string;
  readonly segment: string;
  readonly urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly frequency: 'RARE' | 'OCCASIONAL' | 'FREQUENT';
}
