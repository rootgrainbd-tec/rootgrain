import { QualityRule } from './quality.rule';

export interface QualityPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<QualityRule>;
}
