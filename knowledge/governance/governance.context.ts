import { KnowledgeContract } from '../contracts/knowledge.contract';

export interface GovernanceContext {
  readonly context_id: string;
  readonly knowledge: KnowledgeContract;
}
