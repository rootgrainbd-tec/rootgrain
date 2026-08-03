export type ContinuityState = 'CREATED' | 'ASSESSED' | 'PLANNED' | 'EXECUTING' | 'VALIDATING' | 'COMPLETED' | 'FAILED';

export interface ContinuityContract {
  readonly continuity_id: string;
  readonly scope: string;
  readonly state: ContinuityState;
}
