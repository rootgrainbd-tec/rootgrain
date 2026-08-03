import { DocumentContract } from '../contracts/document.contract';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class DocumentValidator {
  static validate(contract: DocumentContract): void {
     if (!contract.document_id || !contract.review_status) {
        throw KnowledgeException.validation("Document contract missing properties");
     }
  }
}
