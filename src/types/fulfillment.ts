/**
 * Corresponds to the Prisma LogisticsProvider enum.
 * Represents the entity managing physical delivery.
 */
export type LogisticsProvider = 
  | "PRIVATE_FREIGHT" 
  | "PATHAO" 
  | "REDX" 
  | "DHL";

/**
 * Corresponds to the Prisma TrackingState enum.
 * Represents the production and logistics lifecycle of an order.
 */
export type TrackingState =
  | "PENDING_PRODUCTION"
  | "IN_PRODUCTION"
  | "QUALITY_CHECK"
  | "DISPATCHED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED_AND_COLLECTED";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  division: string;
  district: string;
  addressLine: string;
}

export const TRACKING_STATE_LABELS: Record<TrackingState, string> = {
  "PENDING_PRODUCTION": "Pending Production",
  "IN_PRODUCTION": "In Production",
  "QUALITY_CHECK": "Quality Check",
  "DISPATCHED": "Dispatched",
  "OUT_FOR_DELIVERY": "Out for Delivery",
  "DELIVERED_AND_COLLECTED": "Delivered & Settled",
};

export const LOGISTICS_PROVIDER_LABELS: Record<LogisticsProvider, string> = {
  "PRIVATE_FREIGHT": "RootGrain Private Freight",
  "PATHAO": "Pathao Courier",
  "REDX": "RedX Courier",
  "DHL": "DHL Express",
};

/**
 * Primary operations node for all dispatch and fulfillment communications.
 * Must be used in all delivery-related notifications.
 */
export const DISPATCH_OPERATIONS_NODE = "+88 01305-993024";
