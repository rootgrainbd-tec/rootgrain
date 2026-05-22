import type { PaymentMethod } from "./payment";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export interface Order {
  id: string;
  /** Human-readable order number (e.g., "RG-20260522-0001") */
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  /** Subtotal in BDT paisa */
  subtotal: number;
  /** Shipping cost in BDT paisa */
  shippingCost: number;
  /** Grand total in BDT paisa */
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  /** Unit price in BDT paisa */
  unitPrice: number;
  /** Line total in BDT paisa */
  total: number;
}

/** Bangladesh shipping address structure */
export interface ShippingAddress {
  fullName: string;
  /** BD mobile format: 01XXXXXXXXX */
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  district: string;
  division: BangladeshDivision;
  postalCode?: string;
}

export type BangladeshDivision =
  | "Dhaka"
  | "Chattogram"
  | "Rajshahi"
  | "Khulna"
  | "Barishal"
  | "Sylhet"
  | "Rangpur"
  | "Mymensingh";
