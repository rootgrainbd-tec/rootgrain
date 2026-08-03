import { ACCOUNTING_STATUS } from '../constants/accounting.constants';

export type AccountingStatus = typeof ACCOUNTING_STATUS[keyof typeof ACCOUNTING_STATUS];
