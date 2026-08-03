import { OwnershipContract } from '../contracts/ownership.contract';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class OwnerRegistry {
  private static ownerships = new Map<string, OwnershipContract>();

  static register(contract: OwnershipContract): void {
     if (this.ownerships.has(contract.ownership_id)) {
        throw KnowledgeException.validation("Duplicate Ownership ID");
     }
     this.ownerships.set(contract.ownership_id, contract);
  }
}
