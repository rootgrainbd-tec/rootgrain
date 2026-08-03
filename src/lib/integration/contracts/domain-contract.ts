import { INTEGRATION_DOMAINS } from '../constants/integration.constants';

export type DomainIdentifier = typeof INTEGRATION_DOMAINS[keyof typeof INTEGRATION_DOMAINS];

export interface DomainContract {
  identifier: DomainIdentifier;
  version: string;
  isReady(): boolean;
}
