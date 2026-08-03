import { ChangeContract } from '../contracts/change.contract';

export interface ChangeRequest {
  readonly request_id: string;
  readonly contract: ChangeContract;
  readonly payload_hash: string;
}
