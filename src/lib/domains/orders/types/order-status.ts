import { ORDER_STATUS } from '../constants/order.constants';

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
