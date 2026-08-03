import { KnowledgeContract, KnowledgeStatus } from '../contracts/knowledge.contract';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class KnowledgeLifecycle {
  static transition(contract: KnowledgeContract, newStatus: KnowledgeStatus): KnowledgeContract {
     if (contract.lifecycle_status === 'RETIRED') {
        throw KnowledgeException.failClosed("Retired knowledge cannot change status");
     }
     return { ...contract, lifecycle_status: newStatus };
  }
}
