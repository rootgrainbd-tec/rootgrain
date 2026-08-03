import { EnvironmentContract } from '../contracts/environment.contract';

export interface EnvironmentProfile {
  readonly profile_id: string;
  readonly contract: EnvironmentContract;
  readonly dependencies: ReadonlyArray<string>;
}
