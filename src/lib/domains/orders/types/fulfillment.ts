import { FULFILLMENT_STATUS } from '../constants/fulfillment.constants';

export type FulfillmentStatus = typeof FULFILLMENT_STATUS[keyof typeof FULFILLMENT_STATUS];

export interface FulfillmentItem {
  order_item_id: string;
  quantity: number;
}

export interface Fulfillment {
  id: string;
  order_id: string;
  status: FulfillmentStatus;
  items: FulfillmentItem[];
  tracking_reference?: string;
  created_at: Date;
  shipped_at?: Date;
  delivered_at?: Date;
}
