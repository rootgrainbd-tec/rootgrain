import { STOCK_STATUS } from '../constants/inventory.constants';

export type StockStatus = typeof STOCK_STATUS[keyof typeof STOCK_STATUS];
