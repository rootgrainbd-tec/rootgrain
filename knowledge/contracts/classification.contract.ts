import { ClassificationLevel } from './knowledge.contract';

export interface ClassificationContract {
  readonly classification_id: string;
  readonly level: ClassificationLevel;
  readonly handling_rules: ReadonlyArray<string>;
}
