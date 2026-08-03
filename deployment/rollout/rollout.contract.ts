export type RolloutState = 'CREATED' | 'VALIDATING' | 'DEPLOYING' | 'VERIFYING' | 'COMPLETED' | 'FAILED' | 'ROLLING_BACK';

export interface RolloutContract {
  readonly rollout_id: string;
  readonly release_id: string;
  readonly target_environment: string;
  readonly state: RolloutState;
}
