import { PartnerContract } from './partner.contract';

export interface EcosystemContext {
  readonly context_id: string;
  readonly rules: ReadonlyArray<string>;
}
