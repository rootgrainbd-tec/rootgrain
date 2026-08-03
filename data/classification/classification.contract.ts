export type ClassificationLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export interface ClassificationContract {
  readonly data_id: string;
  readonly classification_level: ClassificationLevel;
}
