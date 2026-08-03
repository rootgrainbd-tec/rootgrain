import { ClassificationLevel } from './classification.contract';

export interface ClassificationPolicy {
  readonly policy_id: string;
  readonly level: ClassificationLevel;
  readonly handling_rules: ReadonlyArray<string>;
}
