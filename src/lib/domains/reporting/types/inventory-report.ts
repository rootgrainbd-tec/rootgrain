import { BaseReport } from './analytics-report';

export interface InventoryReport extends BaseReport {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
}
