import { LifecycleStatus } from './data.contract';
import { ClassificationLevel } from '../classification/classification.contract';

export interface GovernanceContext {
  readonly governance_id: string;
  readonly data_owner: string;
  readonly data_scope: string;
  readonly classification_level: ClassificationLevel;
  readonly lifecycle_status: LifecycleStatus;
}
