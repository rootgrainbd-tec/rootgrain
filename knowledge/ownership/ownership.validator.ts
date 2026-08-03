import { OwnershipContract } from '../contracts/ownership.contract';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class OwnershipValidator {
  static validate(contract: OwnershipContract): void {
     if (!contract.primary_owner || !contract.accountability_status) {
        throw KnowledgeException.validation("Ownership contract missing key accountability fields");
     }
  }
}
