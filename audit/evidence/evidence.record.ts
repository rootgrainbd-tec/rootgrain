import { EvidenceContract } from '../contracts/evidence.contract';

export interface EvidenceRecord {
  readonly record_id: string;
  readonly contract: EvidenceContract;
  readonly payload_hash: string;
}
