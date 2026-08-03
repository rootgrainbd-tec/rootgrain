import { PRODUCTION_STATUS } from '../constants/production.constants';

export type ProductionStatus = typeof PRODUCTION_STATUS[keyof typeof PRODUCTION_STATUS];
