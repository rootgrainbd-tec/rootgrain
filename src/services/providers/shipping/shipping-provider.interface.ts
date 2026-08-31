import { DeliveryState } from "@prisma/client";

export interface RootGrainShippingAddress {
  name: string;
  phone: string;
  street: string;
  district: string;
  division: string;
  email?: string;
}

export interface CreateShipmentRequest {
  invoice: string;
  recipient: RootGrainShippingAddress;
  codAmount: number;
  deliveryType: number;
  note?: string;
}

export type NormalizedProviderStatus =
  | { type: "TRANSITION"; targetState: DeliveryState }
  | { type: "PROVIDER_ONLY"; providerRawStatus: string }
  | { type: "CANCEL_ORDER"; providerRawStatus: string };

export interface ProviderShipmentResult {
  trackingReference: string;
  normalizedStatus: NormalizedProviderStatus;
}

export interface ShippingProvider {
  /**
   * Attempts to create a shipment.
   * Must guarantee idempotency internally (e.g. checking existing shipment first).
   */
  createShipment(request: CreateShipmentRequest): Promise<ProviderShipmentResult>;

  /**
   * Retrieves the current status of an existing shipment by invoice identifier.
   */
  getShipmentStatus(invoice: string): Promise<ProviderShipmentResult>;
}
