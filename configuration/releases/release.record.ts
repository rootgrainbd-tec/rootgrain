import { ReleaseContract } from '../contracts/release.contract';

export interface ReleaseRecord {
  readonly record_id: string;
  readonly contract: ReleaseContract;
  readonly dependencies: ReadonlyArray<string>;
}
