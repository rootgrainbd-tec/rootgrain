import { AccessContract } from '../contracts/access.contract';

export interface AccessRequest {
  readonly request_contract: AccessContract;
  readonly justification: string;
  readonly requested_at: number;
}
