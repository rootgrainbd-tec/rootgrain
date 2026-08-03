import { NotificationContract } from './notification.contract';

export interface DeliveryContract {
  dispatch(notification: NotificationContract): Promise<void>;
}
