import { KnowledgeContract } from '../contracts/knowledge.contract';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class KnowledgeValidator {
  static validate(contract: KnowledgeContract): void {
     if (!contract.knowledge_id || !contract.lifecycle_status) {
        throw KnowledgeException.validation("Knowledge contract missing properties");
     }
  }
}
