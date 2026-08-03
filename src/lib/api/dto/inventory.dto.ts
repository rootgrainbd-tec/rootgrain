export interface InventoryResponseDto {
  id: string;
  resource_id: string;
  location_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  status: string;
}
