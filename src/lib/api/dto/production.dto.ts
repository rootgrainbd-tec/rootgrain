export interface ProductionResponseDto {
  id: string;
  batch_id: string;
  inventory_id: string;
  status: string;
  quality_status: string;
  target_quantity: number;
  completed_quantity: number;
}
