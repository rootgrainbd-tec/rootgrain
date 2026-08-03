export interface AccountBalance {
  account_id: string;
  total_debit: number;
  total_credit: number;
  current_balance: number;
  last_updated: Date;
}
