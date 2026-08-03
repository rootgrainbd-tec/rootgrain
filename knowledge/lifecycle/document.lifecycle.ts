import { DocumentContract } from '../contracts/document.contract';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class DocumentLifecycle {
  static archive(contract: DocumentContract): DocumentContract {
     if (contract.review_status === 'ARCHIVED') {
        throw KnowledgeException.failClosed("Document is already archived");
     }
     return { ...contract, review_status: 'ARCHIVED' };
  }
}
