/** Supported payment methods for Bangladesh operations */
export type PaymentMethod = "bkash" | "cod" | "bank_transfer";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bkash: "bKash",
  cod: "Cash on Delivery",
  bank_transfer: "Bank Transfer",
};

/**
 * bKash transaction lifecycle.
 * Maps to bKash Payment Gateway API callback states.
 */
export type BkashTransactionStatus =
  | "initiated"       // Payment request created, awaiting customer action
  | "authorized"      // Customer authorized in bKash app
  | "completed"       // Funds transferred successfully
  | "failed"          // Transaction failed (timeout, insufficient balance)
  | "cancelled"       // Customer cancelled in bKash app
  | "refunded";       // Full or partial refund processed

/**
 * Cash on Delivery lifecycle.
 * Tracks the physical cash collection flow from order to deposit.
 */
export type CodStatus =
  | "pending"           // Order placed, awaiting dispatch
  | "out_for_delivery"  // With delivery agent
  | "collected"         // Cash collected by delivery agent
  | "verified"          // Amount verified and deposited
  | "failed"            // Delivery attempted, customer unavailable
  | "returned";         // Item returned to warehouse

export interface PaymentRecord {
  id: string;
  orderId: string;
  method: PaymentMethod;
  /** Amount in BDT paisa */
  amount: number;
  status: BkashTransactionStatus | CodStatus;
  /** bKash transaction ID (e.g., "BGH02NXYZ9") — only for bkash method */
  bkashTrxId?: string;
  paidAt?: string;
  createdAt: string;
}
