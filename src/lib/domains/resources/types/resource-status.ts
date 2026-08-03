import { RESOURCE_STATUS } from '../constants/resource.constants';

export type ResourceStatus = typeof RESOURCE_STATUS[keyof typeof RESOURCE_STATUS];
