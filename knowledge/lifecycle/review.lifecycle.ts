import { DocumentContract, ReviewStatus } from '../contracts/document.contract';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class ReviewLifecycle {
  static transition(contract: DocumentContract, newStatus: ReviewStatus): DocumentContract {
     if (contract.review_status === 'ARCHIVED') {
        throw KnowledgeException.failClosed("Archived documents cannot undergo review");
     }
     return { ...contract, review_status: newStatus };
  }
}
