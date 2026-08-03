import { DocumentContract } from '../contracts/document.contract';

export interface DocumentRecord {
  readonly record_id: string;
  readonly contract: DocumentContract;
  readonly location_uri: string;
}
