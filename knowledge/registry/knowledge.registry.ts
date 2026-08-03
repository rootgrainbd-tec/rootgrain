import { KnowledgeContract } from '../contracts/knowledge.contract';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class KnowledgeRegistry {
  private static knowledge = new Map<string, KnowledgeContract>();

  static register(contract: KnowledgeContract): void {
     if (this.knowledge.has(contract.knowledge_id)) throw KnowledgeException.validation("Duplicate Knowledge ID");
     this.knowledge.set(contract.knowledge_id, contract);
  }
}
