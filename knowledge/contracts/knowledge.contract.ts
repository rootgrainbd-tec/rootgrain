export type KnowledgeStatus = 'CREATED' | 'REVIEWING' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED' | 'RETIRED';
export type ClassificationLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export interface KnowledgeContract {
  readonly knowledge_id: string;
  readonly owner: string;
  readonly scope: string;
  readonly classification_level: ClassificationLevel;
  readonly lifecycle_status: KnowledgeStatus;
  readonly version: string;
}
