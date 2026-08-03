export interface OrderItem {
  id: string;
  resource_id: string; // Refers to domains/resources
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number;
  tax: number;
}
