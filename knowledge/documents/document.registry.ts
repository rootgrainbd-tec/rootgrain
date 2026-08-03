import { DocumentContract } from '../contracts/document.contract';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class DocumentRegistry {
  private static documents = new Map<string, DocumentContract>();

  static register(contract: DocumentContract): void {
     if (this.documents.has(contract.document_id)) {
        throw KnowledgeException.validation("Duplicate Document ID");
     }
     this.documents.set(contract.document_id, contract);
  }
}
