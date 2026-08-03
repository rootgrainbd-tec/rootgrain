export interface AccountingResponseDto {
  id: string;
  invoice_number: string;
  order_id: string;
  status: string;
  total: number;
  outstanding_amount: number;
}
